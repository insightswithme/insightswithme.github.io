---
title: How to Set Up SolrCloud with ZooKeeper for Sitecore on Windows
description: >-
  A practical Windows walkthrough for Sitecore SolrCloud: two Solr nodes, a
  three-member ZooKeeper ensemble, HTTPS, a private load balancer, collections,
  aliases, and failover checks.
keywords: 'sitecore solrcloud, zookeeper, sitecore xp search, solr 9.8.1'
metaDescription: >-
  Set up SolrCloud for Sitecore on Windows with ZooKeeper, HTTPS, a private load
  balancer, collections, aliases, and a clear failover checklist.
featuredImage: >-
  https://images.ctfassets.net/7csiqfkqfved/4TSxAwypfTDl0XTxocZA0r/f89e01c28236da05564ea1ec6fba7f69/solrcloud-sitecore-setup-banner.jpg
slug: how-to-set-up-solrcloud-with-zookeeper-for-sitecore-on-windows
date: 'October 3, 2026 7:30 PM'
modifiedDate: 'October 3, 2026 7:30 PM'
author: Pawan Tyagi
source: Insights With Me
tags:
  - tag: sitecore
---
A Solr dashboard with two green nodes is not the same as a cluster you can trust. The real test is what happens when one node goes offline, or Sitecore starts a rebuild.

This walkthrough builds a Windows SolrCloud environment for Sitecore Content Search:

- Two Solr nodes
- Three external ZooKeeper members
- HTTPS
- A private load balancer
- Collections and aliases Sitecore can switch on rebuild

The worked example is **Solr 9.8.1**, which Sitecore XP **10.4.1** documents as the required search version. Confirm the pairing for *your* Sitecore update, Java, modules, and approved ZooKeeper release before you deploy. Run this in non-production first.

Use **Command Prompt** (`^` continuation) or **PowerShell** as shown. Do not mix the two in one command.

## Architecture

Sitecore should never point at a single Solr host. The request path is:

**Sitecore → private load balancer → a healthy Solr node**

Solr nodes talk to each other and to ZooKeeper. The load balancer protects the Sitecore entry point. It does **not** replace Solr replicas or ZooKeeper quorum.

![Sitecore SolrCloud architecture: Sitecore roles through a private load balancer to two Solr nodes coordinated by three ZooKeeper members](https://images.ctfassets.net/7csiqfkqfved/5uIyukvSKNyqvMG061b1X0/deeba139b79b43522b2824eb5995ed19/solrcloud-sitecore-architecture.png)

Quick vocabulary:

| Term | Meaning |
| --- | --- |
| Collection | Logical index |
| Shard | One slice of that index |
| Replica | A copy of a shard |
| Alias | Stable name that can point at a collection |

One collection with one shard and two NRT replicas means two copies of the same index. Adding servers does not create those replicas automatically.

Example names used below are placeholders:

| Component | Example |
| --- | --- |
| ZooKeeper | `zk01`, `zk02`, `zk03` |
| Solr | `solr01.example.internal`, `solr02.example.internal` |
| Load balancer | `search.example.internal` |
| Paths | `C:\ZooKeeper`, `C:\Solr\solr-9.8.1` |
| Namespace | `/solr` |

Three ZooKeeper voters need **two** members for quorum. Put them in separate failure domains. Apache recommends an external ensemble in production.

Open only the ports you need on a private network: **2181** (ZK clients), **2888/3888** (ZK peers), **8983** (Solr HTTPS), **443** (Sitecore → load balancer). Do not expose ZooKeeper or Solr admin publicly.

Inventory every index first (core, master, web, custom, modules). Treat **xConnect** as a separate rebuild.

## 1. Java and DNS

Install the approved 64-bit JDK (this walkthrough uses Java 17) on every Solr and ZooKeeper server. Set `JAVA_HOME`, add `bin` to `PATH`, and give services the same environment as your shell.

```powershell
java -version
$env:JAVA_HOME
Get-Command java
Resolve-DnsName zk01
Resolve-DnsName solr01.example.internal
```

Use real DNS that points at the intended hosts. Mapping a cluster name to `127.0.0.1` will break peer communication. Certificates must cover the DNS names you actually use.

Download approved Solr and ZooKeeper binaries from Apache and verify checksums. Record the exact maintenance releases you chose.

## 2. ZooKeeper ensemble

Extract ZooKeeper to `C:\ZooKeeper` on each member. Copy `conf\zoo_sample.cfg` to `conf\zoo.cfg`:

```
tickTime=2000
initLimit=10
syncLimit=5
dataDir=C:/ZooKeeper/data
clientPort=2181
autopurge.snapRetainCount=3
autopurge.purgeInterval=1
4lw.commands.whitelist=ruok,srvr,mntr
admin.enableServer=false
server.1=zk01:2888:3888
server.2=zk02:2888:3888
server.3=zk03:2888:3888
```

Create `myid` (plain file, not `myid.txt`). On zk01:

```powershell
New-Item -ItemType Directory -Force C:\ZooKeeper\data
Set-Content C:\ZooKeeper\data\myid -Value '1' -Encoding Ascii
Get-Content C:\ZooKeeper\data\myid
```

Use `2` and `3` on the other members. Do not clone another member’s data directory.

Start all three from Command Prompt:

```
cd /d C:\ZooKeeper
bin\zkServer.cmd
```

Then:

```
C:\ZooKeeper\bin\zkCli.cmd -server zk01:2181
```

At the prompt: `ls /` then `quit`. You want **one leader and two followers**. A TCP connect or `ruok` alone is not enough.

## 3. Solr namespace and HTTPS

A cluster started with `.../solr` is not the same as one without it. Create the namespace **once**, then declare HTTPS **before** nodes start:

```
cd /d C:\Solr\solr-9.8.1
set "ZK_SERVERS=zk01:2181,zk02:2181,zk03:2181"
set "ZK_CLUSTER=%ZK_SERVERS%/solr"
bin\solr.cmd zk mkroot /solr -z "%ZK_SERVERS%"
bin\solr.cmd cluster --property urlScheme --value https -z "%ZK_CLUSTER%"
```

Confirm with ZooKeeper CLI:

```
ls /solr
get /solr/clusterprops.json
```

You should see `"urlScheme":"https"`.

Each Solr node needs a certificate whose SANs match its advertised DNS name. The load balancer needs a cert for `search.example.internal` if it terminates TLS. Windows certificate stores and Java truststores are separate — importing a PFX into Windows does not configure Solr’s JVM.

Place the keystore and truststore under `server\etc`. In `bin\solr.in.cmd` (example for node 1):

```
set "SOLR_HOST=solr01.example.internal"
set "SOLR_JETTY_HOST=0.0.0.0"
set "SOLR_JAVA_MEM=-Xms1g -Xmx1g"
set "ZK_HOST=zk01:2181,zk02:2181,zk03:2181/solr"
set "SOLR_SSL_ENABLED=true"
set "SOLR_SSL_KEY_STORE=C:\Solr\solr-9.8.1\server\etc\node.p12"
set "SOLR_SSL_KEY_STORE_PASSWORD=%SOLR_KEYSTORE_PASSWORD%"
set "SOLR_SSL_TRUST_STORE=C:\Solr\solr-9.8.1\server\etc\trust.p12"
set "SOLR_SSL_TRUST_STORE_PASSWORD=%SOLR_TRUSTSTORE_PASSWORD%"
set "SOLR_SSL_NEED_CLIENT_AUTH=false"
set "SOLR_SSL_WANT_CLIENT_AUTH=false"
set "SOLR_SSL_CHECK_PEER_NAME=true"
```

Use `solr02.example.internal` on the second node. The 1 GB heap is a starting value for a small lab, not production sizing. Do not disable hostname verification to hide a trust error.

## 4. Start Solr and install Windows services

Foreground start (Command Prompt):

```
cd /d C:\Solr\solr-9.8.1
bin\solr.cmd start -c -f -p 8983 ^
-z "zk01:2181,zk02:2181,zk03:2181/solr"
```

`-c` is cloud mode; `-f` keeps the process in the foreground. Both nodes must appear in the same cluster with reachable HTTPS URLs. Stop the manual process before installing the service so two JVMs do not fight for 8983.

Install services with an approved NSSM build (`nssm install ZooKeeper` / `nssm install SolrCloud`):

| Setting | ZooKeeper | SolrCloud |
| --- | --- | --- |
| Application | `C:\Windows\System32\cmd.exe` | `C:\Windows\System32\cmd.exe` |
| Startup directory | `C:\ZooKeeper\bin` | `C:\Solr\solr-9.8.1\bin` |
| Arguments | `/c call C:\ZooKeeper\bin\zkServer.cmd` | `/c call C:\Solr\solr-9.8.1\bin\solr.cmd start -c -f -p 8983` |

Solr reads `ZK_HOST` (including `/solr`) from `solr.in.cmd`. Use dedicated accounts with **Log on as a service**, automatic start, and log rotation. Stopping the wrapper must not leave an orphaned Java process.

Start ZooKeeper first, confirm quorum, then start Solr. After a reboot, confirm membership and certificates again.

## 5. Sitecore configset, collections, aliases

Use the configset and tooling for **your Sitecore release**. Do not overlay an old Solr 8.4 install onto 9.8.1.

Sitecore’s SolrCloud guidance typically sets `_uniqueid` as the required unique key and turns off automatic field creation. Keep the managed-schema workflow your release expects. `maxShardsPerNode` was removed in Solr 9 — do not send it on CREATE.

Upload once:

```
cd /d C:\Solr\solr-9.8.1
bin\solr.cmd zk upconfig ^
-z "zk01:2181,zk02:2181,zk03:2181/solr" ^
-n sitecore-content-v1 ^
-d C:\Solr\configsets\sitecore-content-v1\conf
```

Confirm `sitecore-content-v1` under `/solr/configs`. Editing files on disk after upload does not update the cluster.

Create the live and rebuild collections (PowerShell). Add your org’s auth method — do not put credentials in a script you share.

```powershell
$solrBase = 'https://solr01.example.internal:8983/solr'
$api = "$solrBase/admin/collections"
$collections = @('sitecore_web_index', 'sitecore_web_index_rebuild')
foreach ($name in $collections) {
  Invoke-RestMethod -Method Post -Uri $api -Body @{
    action = 'CREATE'
    name = $name
    numShards = 1
    nrtReplicas = 2
    'collection.configName' = 'sitecore-content-v1'
    wt = 'json'
  }
}
```

Both replicas for each shard should be **active on different hosts**. Do not rerun CREATE against an existing collection.

Initialize switch-on-rebuild aliases **once**:

```powershell
$aliases = @{
  sitecore_web_indexMainAlias = 'sitecore_web_index'
  sitecore_web_indexRebuildAlias = 'sitecore_web_index_rebuild'
}
foreach ($alias in $aliases.Keys) {
  Invoke-RestMethod -Method Post -Uri $api -Body @{
    action = 'CREATEALIAS'
    name = $alias
    collections = $aliases[$alias]
    wt = 'json'
  }
}
Invoke-RestMethod "${api}?action=LISTALIASES&wt=json"
```

After a rebuild, alias *targets* may switch. Do not reset them on every deployment. Repeat only for indexes configured for switch-on-rebuild, using Sitecore’s effective names. Budget disk for both collections and all replicas.

## 6. Point Sitecore at the cluster

Put both Solr nodes behind the private load balancer with backend cert validation and a health probe. Fail one backend through the LB URL **before** Sitecore uses it.

Connection string on the applicable roles:

```xml
<add name="solr.search"
  connectionString="https://search.example.internal/solr;solrCloud=true" />
```

Use the key and port your release actually ships. When nodes are private, review `ContentSearch.IndexingManager.DisplayShortStatistic` so Indexing Manager does not try to hit nodes directly.

On the **one** instance that owns rebuilds, use the cloud switch type (merge into the existing index definition — keep crawlers and strategies):

```xml
<index id="sitecore_web_index"
  type="Sitecore.ContentSearch.SolrProvider.SwitchOnRebuildSolrCloudSearchIndex, Sitecore.ContentSearch.SolrProvider">
  <param desc="mainalias">$(id)MainAlias</param>
  <param desc="rebuildalias">$(id)RebuildAlias</param>
  <param desc="collection">$(id)</param>
  <param desc="rebuildcollection">$(id)_rebuild</param>
</index>
```

Other instances use `SolrSearchIndex` with `core` set to the **main alias**. Only one writer should own switching for a given index.

Then: populate managed schema for both collections, rebuild from Indexing Manager, and verify required fields in both destinations. Rebuild xConnect with its own tooling — a Content Search rebuild does not prove xConnect.

## 7. Prove search and failover

Publish a known test item and confirm the web result: language, security, facets, paging, computed fields.

```powershell
Invoke-RestMethod "${api}?action=CLUSTERSTATUS&wt=json"
Invoke-RestMethod "${api}?action=LISTALIASES&wt=json"
Invoke-RestMethod "$solrBase/sitecore_web_indexMainAlias/select?q=*:*&rows=0"
```

`numFound` is useful, but Sitecore often writes multiple documents per item (languages/versions). A count gap is a reason to investigate, not automatic proof of data loss.

In non-production, run these **one at a time** and restore health between them:

| Test | What you should see |
| --- | --- |
| Stop one Solr node | Queries through the LB continue; remaining replicas active |
| Restart that node | Replicas recover to active |
| Stop one of three ZK members | Quorum remains; cluster ops continue |
| Rebuild the web index | Search stays usable; aliases switch to the new collection |
| Reboot a Windows host | Services return with the same `/solr` namespace and cert trust |

Never stop enough ZooKeeper voters to lose quorum during a routine rolling test. Replicas are not a backup: they also copy deletes.

For a Solr 8.4 → 9.8.1 move, prefer a **parallel cluster** and rebuild from source. Do not copy raw Solr 8 index folders into 9. Keep the old environment for a defined rollback window, and restore the matching Sitecore config if you roll back.

## Troubleshooting

| Symptom | Look at first |
| --- | --- |
| Nodes form two clusters | `ZK_HOST` and the `/solr` suffix — they must match everywhere |
| No ZooKeeper quorum | `myid`, DNS, 2888/3888, logs |
| Connection refused on ZK | Client port **2181** and the host you actually dialed |
| `cannot recover key` | Keystore type, private-key password, file ACLs |
| TLS / hostname failure | SANs vs advertised DNS, trust chain on the **client** making the call |
| Sitecore dies when one Solr stops | Sitecore is not on the load balancer, or probes are wrong |
| Unknown fields / failed indexing | Configset on **both** collections |
| Rebuild “succeeds” but content is stale | Alias targets and which instance owns switching |
| Works interactively, fails as a service | Service account, `JAVA_HOME`, env vars, NSSM stderr |

Read the **earliest** error in ZooKeeper, Solr, or Sitecore logs. A Sitecore timeout is often a Solr certificate problem that only shows on the node.

That is the setup I would take into a lab before any production cutover: identical namespace, HTTPS declared up front, Sitecore on the load balancer, and failover proven with a real publish — not just a green dashboard.

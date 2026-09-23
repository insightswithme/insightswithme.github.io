import type { FC } from "react";

export interface BurgerProps {
  active: boolean;
  onClick: () => void;
}

const Burger: FC<BurgerProps> = ({ active, onClick }) => {
  return (
    <div className={"container " + (active ? "active" : "")} onClick={onClick}>
      <div className={"meat meat-1"} />
      <div className={"meat meat-2"} />
      <div className={"meat meat-3"} />
      <style jsx>
        {`
          .container {
            padding: 0px;
            position: fixed;
            width: 30px;
            height: 30px;
            cursor: pointer;
            top: 0.9rem;
            left: 1.25rem;
            z-index: 1200;
            background-color: transparent;
          }
          .meat {
            position: absolute;
            width: 28px;
            height: 2px;
            background: var(--color-text, #222);
            top: calc(50% - 2px / 2);
            left: calc(50% - 28px / 2);
            transition: all 150ms ease-in;
          }
          .meat-1 {
            transform: translateY(-10px);
          }
          .meat-2 {
            width: calc(28px - 6px);
          }
          .meat-3 {
            transform: translateY(10px);
          }
          .active .meat-1 {
            transform: rotate(45deg);
          }
          .active .meat-2 {
            opacity: 0;
          }
          .active .meat-3 {
            transform: rotate(-45deg);
          }

          .container {
            display: none;
          }

          @media (max-width: 768px) {
            .container {
              display: block;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Burger;

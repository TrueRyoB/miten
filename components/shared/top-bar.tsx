"use client";

import { Suspense } from "react";
import Navigator from "./navigator";

function TopBarNavFallback() {
  return <div className="topbar-nav-wrapper h-[28px] w-[120px]" aria-hidden />;
}

export default function TopBar() {
  return (
    <>
      <style>{`
        .topbar {
            position: fixed; top: 0; left: 0; right: 0;
            height: 50px;
            background: linear-gradient(180deg, rgba(10,5,0,.92) 0%, rgba(20,10,3,.85) 100%);
            border-bottom: 1px solid rgba(160,107,60,.25);
            display: flex; align-items: center; padding: 0 32px;
            z-index: 100;
            gap: 14px;
            backdrop-filter: blur(6px);
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            }
            .topbar-logo {
            font-family: 'Shippori Mincho', serif;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: .15em;
            color: #e8c97a;
            line-height: 1;
            text-shadow: 0 0 20px rgba(232,201,122,.4);
            }
            .topbar-sep {
            width: 1px; height: 18px;
            background: rgba(160,107,60,.3);
            }
            .topbar-sub {
            font-size: 10px;
            color: rgba(200,160,90,.5);
            letter-spacing: .18em;
            font-family: 'Space Mono', monospace;
            text-transform: uppercase;
            }
            .topbar-stats {
            margin-left: auto;
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            color: rgba(200,170,110,.55);
            letter-spacing: .05em;
            }
            .topbar-nav-wrapper {
              display: flex;
              flex-direction: row;
              justify-content: flex-end;
              align-items: center;
              flex-grow: 1;
            }
    `}</style>
      <header className="topbar">
        <div className="topbar-logo">美天</div>
        <div className="topbar-sep"></div>
        <div className="topbar-sub">TSUNDOKU MANAGER</div>
        <div className="topbar-nav-wrapper">
          <Suspense fallback={<TopBarNavFallback />}>
            <Navigator />
          </Suspense>
        </div>
      </header>
    </>
  );
}

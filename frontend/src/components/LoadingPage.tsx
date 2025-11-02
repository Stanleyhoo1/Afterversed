import { memo } from "react";
import "./LoadingPage.css";

const LoadingPage = memo(() => {
  return (
    <div className="loading-page">
      {/* Dynamic gradient background */}
      <div className="loading-background" />
      
      {/* 3D Crystal Box animation */}
      <div className="scene">
        <div className="crystal-box">
          <div className="box-face front"></div>
          <div className="box-face back"></div>
          <div className="box-face right"></div>
          <div className="box-face left"></div>
          <div className="box-face top"></div>
          <div className="box-face bottom"></div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="loading-text-container">
        <h2 className="loading-title">Loading</h2>
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
});

LoadingPage.displayName = 'LoadingPage';

export default LoadingPage;

import React from 'react';
import './styles/LoadingScene.scss';
import LoadingSvg from '../img/Loading.svg';

const LoadingScene = () => {
  return (
    <div className="loading-scene">
      <img src={LoadingSvg} alt="Loading..." />
    </div>
  );
};

export default LoadingScene;
import React from 'react';
import './Result.css';

type Props = {
  onNavigate: (screen: 'start' | 'game' | 'course' | 'result' | 'explanation') => void;
};

const Result: React.FC<Props> = ({ onNavigate }) => {
  
  // 仮のスコアデータ
  const scoreData = {
    courseName: '初級コース',
    correctCount: 24,
    accuracy: '92%',
    combo: 15,
    wrongCommands: ['git commit -m', 'git push origin main']
  };

  return (
    <div className="result-container">
      <div className="result-header">
        <h1 className="result-title">{scoreData.courseName} クリア！</h1>
      </div>

      <div className="score-box">
        <h2 className="score-box-title">スコア</h2>
        <div className="score-details">
          <div>
            <p style={{ margin: 0, color: '#666' }}>正しく打った数</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{scoreData.correctCount}</p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#666' }}>正解率</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#e74c3c' }}>{scoreData.accuracy}</p>
          </div>
        </div>
      </div>

      <div className="stats-container">
        <div style={{ flex: 1 }}>
          <h3 className="stats-title">間違えたコマンド (解説へ)</h3>
          <ul className="wrong-command-list">
            {scoreData.wrongCommands.map((cmd, index) => (
              <li 
                key={index} 
                className="wrong-command-item"
                onClick={() => onNavigate('explanation')}
              >
                {cmd}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h3 className="stats-title">最大連続正解数</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>{scoreData.combo}</p>
        </div>
      </div>


      <div className="action-buttons">
        <button className="action-btn" onClick={() => onNavigate('game')}>もう一度</button>
        <button className="action-btn" onClick={() => onNavigate('course')}>コース選択</button>
        <button className="action-btn" onClick={() => onNavigate('start')}>タイトルへ</button>
      </div>

    </div>
  );
};

export default Result;
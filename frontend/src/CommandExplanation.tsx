import React, { useEffect } from 'react';
import './CommandExplanation.css';
import commandList from './commands.json'; 

type Props = {
  // ★ついでに型の定義も整えました
  onNavigate: (screen: 'start' | 'game' | 'course' | 'result' | 'explanation', target?: string) => void;
  targetCommand?: string | null; 
};

const CommandExplanation: React.FC<Props> = ({ onNavigate, targetCommand }) => {
  
  useEffect(() => {
    if (targetCommand) {

      const baseCommand = targetCommand.split(' ').slice(0, 2).join(' ');

      
      const targetElement = document.getElementById(baseCommand);
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        targetElement.style.backgroundColor = '#fff3e0';
        setTimeout(() => {
          targetElement.style.backgroundColor = 'transparent';
          targetElement.style.transition = 'background-color 1s';
        }, 1000);
      } else {
        console.log(`「${baseCommand}」の解説は見つかりませんでした！`); // 開発用のメモ
      }
    }
  }, [targetCommand]);

  return (
    <div className="explanation-container">
      <div className="explanation-header">
        <h1 className="explanation-title">コマンド一覧と解説</h1>
      </div>

      <div className="command-list">
        {}
        {commandList.map((cmd) => (
          <div key={cmd.name} id={cmd.name} className="command-section">
            <h2 className="command-name">{cmd.name}</h2>
            <p className="command-desc">{cmd.desc}</p>
          </div>
        ))}
      </div>

      <button className="back-to-result-btn" onClick={() => onNavigate('result')}>
        リザルト画面に戻る
      </button>
    </div>
  );
};

export default CommandExplanation;
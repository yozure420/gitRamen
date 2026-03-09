import React from 'react';
import './CourseSelection.css';

type Props = {
  onNavigate: (screen: 'start' | 'game' | 'course' | 'result' | 'explanation') => void;
};

const CourseSelection: React.FC<Props> = ({ onNavigate }) => {

  const courses = [
    { id: 'soft', name: 'やわらかめ', imgPath: '/assets/ramen_soft.png' },
    { id: 'normal', name: 'ふつう', imgPath: '/assets/ramen_normal.png' },
    { id: 'hard', name: 'かため', imgPath: '/assets/ramen_hard.png' },
    { id: 'bari', name: 'バリカタ', imgPath: '/assets/ramen_bari.png' },
  ];

  return (
    <div className="course-container">
      <h1 className="course-title">コースを選択してください</h1>
      
      <div className="course-list">
        {courses.map((course) => (
          <button 
            key={course.id} 
            className="course-btn"
            onClick={() => onNavigate('game')} 
          >
            <span className="course-name">{course.name}</span>
            {}
            <img 
              src={course.imgPath} 
              alt={course.name} 
              className="course-img" 
            />
          </button>
        ))}
      </div>

      <div className="back-to-title-container">
        {}
        <button 
          className="back-to-title-btn"
          onClick={() => onNavigate('start')}
        >
          タイトルに戻る
        </button>
      </div>
    </div>
  );
};

export default CourseSelection;
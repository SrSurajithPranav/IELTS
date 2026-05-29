import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

const startersByType = {
  bar: [
    "The bar chart illustrates...",
    "A comparison of X and Y reveals that...",
    "The highest proportion of... is observed in...",
    "In contrast, the figure for... was significantly lower at...",
    "Overall, X accounted for the largest share, while Y recorded the smallest."
  ],
  line: [
    "The line graph shows changes in... over a period of...",
    "There was a steady increase in... from... to...",
    "The figures fluctuated throughout the period, peaking at...",
    "A dramatic fall occurred in..., dropping from... to...",
    "The trend for X mirrored that of Y, both rising sharply after..."
  ],
  pie: [
    "The pie chart illustrates the proportion of...",
    "X makes up the largest segment at...%, followed by Y at...%",
    "A minority of... is represented by Z at just...%",
    "The remaining...% is accounted for by...",
    "Overall, the distribution is uneven, with X dominating the chart."
  ],
  table: [
    "The table provides data on... across different categories.",
    "X recorded the highest figure at..., while Y showed the lowest at...",
    "There is a clear correlation between... and...",
    "Notably, the numbers for Z increased steadily from... to...",
    "In comparison, the values for... remained relatively stable."
  ],
  process: [
    "The diagram illustrates the process of...",
    "The process consists of... main stages, beginning with...",
    "First, ... is... followed by...",
    "Subsequently, ... is then... before finally...",
    "Overall, the process is cyclical/linear and involves both natural and man‑made steps."
  ],
  map: [
    "The maps show the development of... between... and...",
    "A major change is the replacement of... with...",
    "The most noticeable addition is the construction of...",
    "Several features have been removed, including...",
    "Overall, the area has been transformed from a predominantly rural to an urban landscape."
  ]
};

export default function SentenceStarterLibrary({ onInsert }) {
  const [selectedType, setSelectedType] = useState('bar');
  const [show, setShow] = useState(false);

  const handleInsert = (sentence) => {
    if (onInsert) {
      onInsert(sentence);
    }
    setShow(false);
  };

  if (!show) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShow(true)}>
        📚 Sentence Starters
      </Button>
    );
  }

  return (
    <Card style={{ position: 'relative', marginBottom: '1rem' }}>
      <button
        onClick={() => setShow(false)}
        style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
      >
        ✕
      </button>
      <h4>Task 1 Sentence Starters</h4>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {Object.keys(startersByType).map(type => (
          <Button 
            key={type} 
            size="sm" 
            variant={selectedType === type ? 'primary' : 'outline'} 
            onClick={() => setSelectedType(type)}
          >
            {type.toUpperCase()}
          </Button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
        {startersByType[selectedType].map((sentence, idx) => (
          <button
            key={idx}
            onClick={() => handleInsert(sentence)}
            style={{
              textAlign: 'left',
              padding: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.target.style.background = 'var(--bg-secondary)'}
          >
            {sentence}
          </button>
        ))}
      </div>
    </Card>
  );
}

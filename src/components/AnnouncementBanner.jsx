import React, { useEffect, useState } from 'react';
import { apiCall } from '../api';

export default function AnnouncementBanner() {
  const [ann, setAnn] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiCall('/announcements/');
        if (Array.isArray(res) && res.length) setAnn(res[0]);
      } catch (e) {
        // ignore
      }
    })();
  }, []);
  if (!ann) return null;
  return (
    <div style={{ padding: 12, borderLeft: '4px solid #146c72', background: 'rgba(20,108,114,0.06)', margin: '12px 0', borderRadius: 8 }}>
      <strong>📢 {ann.title}</strong>
      <div style={{ marginTop: 6 }}>{ann.content}</div>
    </div>
  );
}

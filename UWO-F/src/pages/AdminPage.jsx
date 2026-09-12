import React from 'react';

export default function AdminPage() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <iframe
        src="/admin.html"
        title="UWO Admin Portal"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block'
        }}
      />
    </div>
  );
}

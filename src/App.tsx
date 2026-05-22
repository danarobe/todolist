// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔥 여기에 본인 Firebase 설정을 붙여넣으세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const firebaseConfig = {
  apiKey: 'AIzaSyCkzqvj6mHRPTv3Bs8R2FASzZUkwdjcE5I',
  authDomain: 'to-do-list-72556.firebaseapp.com',
  projectId: 'to-do-list-72556',
  storageBucket: 'to-do-list-72556.firebasestorage.app',
  messagingSenderId: '246351724713',
  appId: '1:246351724713:web:7394d8629d156cca64a9b8',
};
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/* ── 유틸 ──────────────────────────────────────────────────── */
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
};
const deadlineCat = (d) => {
  if (!d) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(d + 'T00:00:00');
  const days = Math.round((dl - now) / 86400000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 7) return 'week';
  if (days <= 31) return 'month';
  return 'year';
};
const CAT_COLOR = {
  overdue: '#ef4444',
  today: '#f59e0b',
  week: '#10b981',
  month: '#3b82f6',
  year: '#8b5cf6',
};
const CAT_LABEL = {
  overdue: '⚠ 기한초과',
  today: '오늘',
  week: '이번 주',
  month: '이번 달',
  year: '올해',
};

/* ── Firestore 저장 ─────────────────────────────────────── */
const ss = async (k, v) => {
  try {
    await setDoc(doc(db, 'appdata', k), { value: JSON.stringify(v) });
  } catch (e) {
    console.error('Firestore 저장 오류:', e);
  }
};

/* ── CSS ─────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Noto Sans KR",sans-serif;background:#0c0c0f;color:#e2e2ea;-webkit-font-smoothing:antialiased}
input,textarea,button,select{font-family:"Noto Sans KR",sans-serif!important;outline:none}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#252530;border-radius:2px}
input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5);cursor:pointer}
.trow:hover .del-btn{opacity:1!important}
.nav-link{transition:all .15s;cursor:pointer}
.nav-link:hover{color:#f59e0b!important}
.pill-btn{transition:all .15s;cursor:pointer}
.pill-btn:hover{opacity:.85}
.task-check{transition:all .2s}
.task-check:hover{border-color:#f59e0b!important}
.fab{transition:transform .15s}
.fab:hover{transform:scale(1.05)}
@media(max-width:680px){.sidebar{display:none!important}.bot-nav{display:flex!important}.mob-header{display:flex!important}}
@media(min-width:681px){.bot-nav{display:none!important}.mob-header{display:none!important}}
`;

/* ── EMPTY STATE ─────────────────────────────────────────── */
function Empty({ icon, msg }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0', color: '#525265' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  );
}

/* ── TASK CARD ───────────────────────────────────────────── */
function TaskCard({
  task,
  onComplete,
  onDelete,
  users,
  currentUser,
  showDeadline,
}) {
  const cat = deadlineCat(task.deadline);
  const creator = users[task.createdBy];
  return (
    <div
      className="trow"
      style={{
        background: '#16161e',
        border: '1px solid #222230',
        borderRadius: 12,
        padding: '13px 14px',
        marginBottom: 9,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        transition: 'all .15s',
      }}
    >
      <button
        className="task-check"
        onClick={() => onComplete(task.id)}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${cat === 'overdue' ? '#ef4444' : '#333345'}`,
          background: 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#e2e2ea',
            lineHeight: 1.55,
          }}
        >
          {task.title}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginTop: 5,
            alignItems: 'center',
          }}
        >
          {showDeadline && cat && (
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                background: `${CAT_COLOR[cat]}18`,
                color: CAT_COLOR[cat],
              }}
            >
              {CAT_LABEL[cat]} · {fmtDate(task.deadline)}
            </span>
          )}
          {task.isPrivate && (
            <span
              style={{
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 10,
                background: '#8b5cf618',
                color: '#8b5cf6',
              }}
            >
              🔒 비공개
            </span>
          )}
          {creator && task.createdBy !== currentUser && (
            <span style={{ fontSize: 11, color: '#525265' }}>
              by {creator.displayName}
            </span>
          )}
          {(task.sharedWith || []).length > 0 && (
            <span style={{ fontSize: 11, color: '#525265' }}>👥 공유됨</span>
          )}
        </div>
      </div>
      <button
        className="del-btn"
        onClick={() => onDelete(task.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#252530',
          cursor: 'pointer',
          fontSize: 20,
          flexShrink: 0,
          padding: '0 3px',
          opacity: 0,
          transition: 'opacity .15s',
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ── EVERYDAY CARD ───────────────────────────────────────── */
function EverydayCard({ task, onCheck, onDelete, currentUser, users }) {
  const td = todayStr();
  const list = task.everydayChecks?.[td] || [];
  const checked = list.includes(currentUser);
  return (
    <div
      style={{
        background: '#16161e',
        border: `1px solid ${checked ? '#f59e0b30' : '#222230'}`,
        borderRadius: 12,
        padding: '13px 14px',
        marginBottom: 9,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
      }}
    >
      <button
        onClick={() => onCheck(task.id)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          border: `2px solid ${checked ? '#f59e0b' : '#333345'}`,
          background: checked ? '#f59e0b' : 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0c0c0f',
          fontWeight: 700,
          fontSize: 14,
          transition: 'all .2s',
        }}
      >
        {checked && '✓'}
      </button>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: checked ? '#525265' : '#e2e2ea',
            textDecoration: checked ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </div>
        {list.length > 0 && (
          <div style={{ fontSize: 11, color: '#525265', marginTop: 3 }}>
            오늘 체크: {list.map((u) => users[u]?.displayName || u).join(', ')}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#333345',
          cursor: 'pointer',
          fontSize: 19,
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ── COMPLETED CARD ──────────────────────────────────────── */
function CompletedCard({ task }) {
  return (
    <div
      style={{
        background: '#16161e',
        border: '1px solid #1a1a26',
        borderRadius: 12,
        padding: '11px 14px',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        opacity: 0.6,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#f59e0b18',
          border: '2px solid #f59e0b50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: '#f59e0b',
          flexShrink: 0,
        }}
      >
        ✓
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            color: '#7a7a92',
            textDecoration: 'line-through',
          }}
        >
          {task.title}
        </div>
        <div style={{ fontSize: 11, color: '#3a3a52', marginTop: 2 }}>
          {task.completedAt} 완료
        </div>
      </div>
    </div>
  );
}

/* ── IDEA CARD ───────────────────────────────────────────── */
function IdeaCard({ task, onDelete }) {
  return (
    <div
      style={{
        background: '#16161e',
        border: '1px solid #222230',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 7,
        }}
      >
        <span style={{ fontSize: 11, color: '#525265' }}>{task.createdAt}</span>
        <button
          onClick={() => onDelete(task.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#333345',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 14, color: '#e2e2ea', lineHeight: 1.65 }}>
        {task.title}
      </div>
      {task.memo && (
        <div
          style={{
            fontSize: 13,
            color: '#7a7a92',
            marginTop: 8,
            lineHeight: 1.55,
            borderTop: '1px solid #222230',
            paddingTop: 8,
          }}
        >
          {task.memo}
        </div>
      )}
    </div>
  );
}

/* ── ADD MODAL ───────────────────────────────────────────── */
function AddModal({ initType, onAdd, onClose, friends }) {
  const [type, setType] = useState(initType);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert(
        '이 브라우저는 음성 입력을 지원하지 않습니다.\nChrome 또는 Safari를 이용해주세요.'
      );
      return;
    }
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      setTitle(e.results[0][0].transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };
  const stopVoice = () => {
    recRef.current?.stop();
    setListening(false);
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      memo: memo.trim() || null,
      type,
      deadline: type === 'task' ? deadline || null : null,
      completed: false,
      completedAt: null,
      isPrivate,
      sharedWith: isPrivate ? [] : sharedWith,
      everydayChecks: {},
    });
  };

  const typeMap = {
    task: '📋 할 일',
    everyday: '🔄 매일 할 일',
    idea: '💡 아이디어',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.8)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#16161e',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: 540,
          padding: '22px',
          paddingBottom: 'calc(22px + env(safe-area-inset-bottom))',
          border: '1px solid #222230',
          borderBottom: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 18,
            background: '#0c0c0f',
            borderRadius: 10,
            padding: 3,
          }}
        >
          {Object.entries(typeMap).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setType(k)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 8,
                border: 'none',
                background: type === k ? '#f59e0b' : 'transparent',
                color: type === k ? '#0c0c0f' : '#525265',
                fontWeight: type === k ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAdd()}
            placeholder={
              type === 'idea'
                ? '아이디어를 입력하세요...'
                : type === 'everyday'
                ? '매일 할 일을 입력하세요...'
                : '할 일을 입력하세요...'
            }
            style={{
              flex: 1,
              background: '#0c0c0f',
              border: '1px solid #2a2a38',
              borderRadius: 10,
              padding: '11px 13px',
              color: '#e2e2ea',
              fontSize: 14,
            }}
          />
          <button
            onClick={listening ? stopVoice : startVoice}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: listening ? '#ef444418' : '#f59e0b15',
              border: `1px solid ${listening ? '#ef4444' : '#f59e0b60'}`,
              color: listening ? '#ef4444' : '#f59e0b',
              fontSize: 20,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {listening ? '⏹' : '🎙'}
          </button>
        </div>
        {listening && (
          <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>
            🔴 음성 인식 중… 말씀하세요
          </div>
        )}
        {type === 'task' && (
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{
              width: '100%',
              background: '#0c0c0f',
              border: '1px solid #2a2a38',
              borderRadius: 10,
              padding: '10px 13px',
              color: '#e2e2ea',
              fontSize: 14,
              marginBottom: 10,
            }}
          />
        )}
        {type === 'idea' && (
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="추가 메모 (선택)..."
            rows={3}
            style={{
              width: '100%',
              background: '#0c0c0f',
              border: '1px solid #2a2a38',
              borderRadius: 10,
              padding: '10px 13px',
              color: '#e2e2ea',
              fontSize: 14,
              resize: 'none',
              marginBottom: 10,
            }}
          />
        )}
        {type !== 'idea' && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 13px',
              background: '#0c0c0f',
              borderRadius: 10,
              border: '1px solid #1a1a26',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 13,
                color: '#7a7a92',
                marginBottom: friends.length > 0 && !isPrivate ? 10 : 0,
              }}
            >
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ accentColor: '#8b5cf6' }}
              />
              🔒 비공개 (나만 보기)
            </label>
            {!isPrivate && friends.length > 0 && (
              <div>
                <div
                  style={{ fontSize: 12, color: '#525265', marginBottom: 7 }}
                >
                  공유할 친구:
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {friends.map((f) => {
                    const on = sharedWith.includes(f.username);
                    return (
                      <label
                        key={f.username}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer',
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 20,
                          border: `1px solid ${on ? '#f59e0b' : '#2a2a38'}`,
                          color: on ? '#f59e0b' : '#525265',
                          background: on ? '#f59e0b10' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) =>
                            setSharedWith((p) =>
                              e.target.checked
                                ? [...p, f.username]
                                : p.filter((x) => x !== f.username)
                            )
                          }
                          style={{ display: 'none' }}
                        />
                        {f.displayName}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 10,
              border: '1px solid #2a2a38',
              background: 'transparent',
              color: '#525265',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={handleAdd}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: '#f59e0b',
              color: '#0c0c0f',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── LOGIN SCREEN ────────────────────────────────────────── */
function LoginScreen({
  mode,
  setMode,
  username,
  setUsername,
  dispName,
  setDispName,
  onLogin,
  onRegister,
  err,
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0c0c0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: '#f59e0b',
              letterSpacing: -2,
            }}
          >
            FOCUS
          </div>
          <div style={{ fontSize: 13, color: '#525265', marginTop: 6 }}>
            할 일을 절대 까먹지 않는 법
          </div>
        </div>
        <div
          style={{
            background: '#16161e',
            border: '1px solid #222230',
            borderRadius: 18,
            padding: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              background: '#0c0c0f',
              borderRadius: 10,
              padding: 3,
              marginBottom: 22,
            }}
          >
            {[
              ['login', '로그인'],
              ['register', '회원가입'],
            ].map(([m, l]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: 'none',
                  background: mode === m ? '#f59e0b' : 'transparent',
                  color: mode === m ? '#0c0c0f' : '#525265',
                  fontWeight: mode === m ? 700 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 (영문 소문자, 숫자, _)"
              style={{
                background: '#0c0c0f',
                border: '1px solid #2a2a38',
                borderRadius: 10,
                padding: '11px 14px',
                color: '#e2e2ea',
                fontSize: 14,
                width: '100%',
              }}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                (mode === 'login' ? onLogin() : onRegister())
              }
            />
            {mode === 'register' && (
              <input
                value={dispName}
                onChange={(e) => setDispName(e.target.value)}
                placeholder="이름"
                style={{
                  background: '#0c0c0f',
                  border: '1px solid #2a2a38',
                  borderRadius: 10,
                  padding: '11px 14px',
                  color: '#e2e2ea',
                  fontSize: 14,
                  width: '100%',
                }}
                onKeyDown={(e) => e.key === 'Enter' && onRegister()}
              />
            )}
            {err && (
              <div
                style={{ fontSize: 12, color: '#ef4444', padding: '2px 4px' }}
              >
                {err}
              </div>
            )}
            <button
              onClick={mode === 'login' ? onLogin : onRegister}
              style={{
                background: '#f59e0b',
                border: 'none',
                borderRadius: 10,
                padding: '12px',
                color: '#0c0c0f',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              {mode === 'login' ? '시작하기' : '계정 만들기'}
            </button>
          </div>
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 18,
            fontSize: 12,
            color: '#3a3a52',
            lineHeight: 1.6,
          }}
        >
          모든 기기에서 실시간 동기화됩니다 🔥
        </div>
      </div>
    </div>
  );
}

/* ── SETTINGS MODAL ──────────────────────────────────────── */
function SettingsModal({
  user,
  users,
  friends,
  friendInput,
  setFriendInput,
  onAddFriend,
  onRemoveFriend,
  onLogout,
  onClose,
  friendMsg,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.8)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#16161e',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          padding: '22px',
          paddingBottom: 'calc(22px + env(safe-area-inset-bottom))',
          border: '1px solid #222230',
          borderBottom: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#f59e0b18',
              border: '2px solid #f59e0b40',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            {user.displayName[0]}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {user.displayName}
            </div>
            <div style={{ fontSize: 12, color: '#525265' }}>
              @{user.username}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: '1px solid #2a2a38',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#7a7a92',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
        <div style={{ borderTop: '1px solid #1a1a26', paddingTop: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#7a7a92',
              marginBottom: 12,
            }}
          >
            👥 친구 목록
          </div>
          {friends.map((f) => (
            <div
              key={f.username}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                fontSize: 13,
                color: '#9898b2',
              }}
            >
              <span>
                • {f.displayName}{' '}
                <span style={{ color: '#3a3a52' }}>@{f.username}</span>
              </span>
              <button
                onClick={() => onRemoveFriend(f.username)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3a3a52',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
          ))}
          {friends.length === 0 && (
            <div style={{ fontSize: 13, color: '#3a3a52', marginBottom: 8 }}>
              아직 친구가 없어요
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddFriend()}
              placeholder="친구 아이디 입력"
              style={{
                flex: 1,
                background: '#0c0c0f',
                border: '1px solid #2a2a38',
                borderRadius: 9,
                padding: '9px 12px',
                color: '#e2e2ea',
                fontSize: 13,
              }}
            />
            <button
              onClick={onAddFriend}
              style={{
                background: '#f59e0b',
                border: 'none',
                borderRadius: 9,
                padding: '9px 16px',
                color: '#0c0c0f',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              추가
            </button>
          </div>
          {friendMsg && (
            <div
              style={{
                fontSize: 12,
                color: friendMsg.startsWith('⚠') ? '#ef4444' : '#f59e0b',
                marginTop: 7,
              }}
            >
              {friendMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN APP ────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [tasks, setTasks] = useState({});
  const [tab, setTab] = useState('todo');
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('task');
  const [loginUn, setLoginUn] = useState('');
  const [loginDn, setLoginDn] = useState('');
  const [loginMode, setLoginMode] = useState('login');
  const [loginErr, setLoginErr] = useState('');
  const [friendInput, setFriendInput] = useState('');
  const [friendMsg, setFriendMsg] = useState('');
  const [showFriends, setShowFriends] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* ── Firestore 실시간 구독 ── */
  useEffect(() => {
    const unsubU = onSnapshot(
      doc(db, 'appdata', 'focus_users_v3'),
      (snap) => {
        setUsers(snap.exists() ? JSON.parse(snap.data().value) : {});
      },
      (err) => console.error('users 구독 오류:', err)
    );

    const unsubT = onSnapshot(
      doc(db, 'appdata', 'focus_tasks_v3'),
      (snap) => {
        setTasks(snap.exists() ? JSON.parse(snap.data().value) : {});
        setLoading(false);
      },
      (err) => {
        console.error('tasks 구독 오류:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubU();
      unsubT();
    };
  }, []);

  const saveU = async (u) => {
    setUsers(u);
    await ss('focus_users_v3', u);
  };
  const saveT = async (t) => {
    setTasks(t);
    await ss('focus_tasks_v3', t);
  };

  const doLogin = () => {
    const u = loginUn.trim().toLowerCase();
    if (!u) {
      setLoginErr('아이디를 입력하세요');
      return;
    }
    if (!users[u]) {
      setLoginErr('등록되지 않은 아이디입니다');
      return;
    }
    setUser(users[u]);
    setLoginErr('');
  };

  const doRegister = async () => {
    const u = loginUn.trim().toLowerCase();
    const n = loginDn.trim();
    if (!u || !n) {
      setLoginErr('아이디와 이름을 입력하세요');
      return;
    }
    if (!/^[a-z0-9_]{2,20}$/.test(u)) {
      setLoginErr('아이디: 영문 소문자·숫자·_ 2-20자');
      return;
    }
    if (users[u]) {
      setLoginErr('이미 사용 중인 아이디입니다');
      return;
    }
    const nu = {
      username: u,
      displayName: n,
      friends: [],
      createdAt: todayStr(),
    };
    await saveU({ ...users, [u]: nu });
    setUser(nu);
    setLoginErr('');
  };

  const addFriend = async () => {
    const f = friendInput.trim().toLowerCase();
    if (!f || f === user.username) return;
    if (!users[f]) {
      setFriendMsg('⚠ 존재하지 않는 사용자');
      setTimeout(() => setFriendMsg(''), 2500);
      return;
    }
    if ((user.friends || []).includes(f)) {
      setFriendMsg('⚠ 이미 추가된 친구');
      setTimeout(() => setFriendMsg(''), 2500);
      return;
    }
    const updated = { ...user, friends: [...(user.friends || []), f] };
    await saveU({ ...users, [user.username]: updated });
    setUser(updated);
    setFriendInput('');
    setFriendMsg('✓ 추가됨!');
    setTimeout(() => setFriendMsg(''), 2500);
  };

  const removeFriend = async (f) => {
    const updated = {
      ...user,
      friends: (user.friends || []).filter((x) => x !== f),
    };
    await saveU({ ...users, [user.username]: updated });
    setUser(updated);
  };

  const addTask = async (data) => {
    const id = uid();
    await saveT({
      ...tasks,
      [id]: { id, ...data, createdBy: user.username, createdAt: todayStr() },
    });
    setShowAdd(false);
  };

  const completeTask = async (id) =>
    await saveT({
      ...tasks,
      [id]: { ...tasks[id], completed: true, completedAt: todayStr() },
    });
  const deleteTask = async (id) => {
    const t = { ...tasks };
    delete t[id];
    await saveT(t);
  };
  const checkEveryday = async (id) => {
    const t = tasks[id];
    const td = todayStr();
    const checks = t.everydayChecks || {};
    const list = checks[td] || [];
    const has = list.includes(user.username);
    await saveT({
      ...tasks,
      [id]: {
        ...t,
        everydayChecks: {
          ...checks,
          [td]: has
            ? list.filter((x) => x !== user.username)
            : [...list, user.username],
        },
      },
    });
  };

  if (loading)
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c0c0f',
          color: '#f59e0b',
          fontFamily: '"Noto Sans KR",sans-serif',
          fontSize: 16,
        }}
      >
        <style>{CSS}</style>
        🔥 Firebase 연결 중...
      </div>
    );

  if (!user)
    return (
      <>
        <style>{CSS}</style>
        <LoginScreen
          mode={loginMode}
          setMode={setLoginMode}
          username={loginUn}
          setUsername={setLoginUn}
          dispName={loginDn}
          setDispName={setLoginDn}
          onLogin={doLogin}
          onRegister={doRegister}
          err={loginErr}
        />
      </>
    );

  const vis = Object.values(tasks).filter((t) => {
    if (t.type === 'idea') return t.createdBy === user.username;
    if (t.isPrivate) return t.createdBy === user.username;
    return (
      t.createdBy === user.username ||
      (t.sharedWith || []).includes(user.username)
    );
  });

  const todoTasks = vis.filter(
    (t) => t.type === 'task' && !t.completed && t.deadline
  );
  const dontforget = vis.filter(
    (t) => t.type === 'task' && !t.completed && !t.deadline
  );
  const everyday = vis.filter((t) => t.type === 'everyday');
  const completed = vis.filter((t) => t.completed);
  const ideas = vis.filter((t) => t.type === 'idea');

  const fTodo = todoTasks
    .filter((t) => {
      const c = deadlineCat(t.deadline);
      if (filter === 'today') return ['today', 'overdue'].includes(c);
      if (filter === 'week') return ['today', 'week', 'overdue'].includes(c);
      if (filter === 'month')
        return ['today', 'week', 'month', 'overdue'].includes(c);
      return true;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const friends = (user.friends || []).map((f) => users[f]).filter(Boolean);

  const TABS = [
    { id: 'todo', label: '할 일', icon: '📋', badge: todoTasks.length },
    { id: 'everyday', label: '매일', icon: '🔄', badge: 0 },
    {
      id: 'dontforget',
      label: '잊지말자',
      icon: '⚡',
      badge: dontforget.length,
    },
    { id: 'completed', label: '완료', icon: '✅', badge: 0 },
    { id: 'ideas', label: '아이디어', icon: '💡', badge: 0 },
  ];

  const openAdd = () => {
    setAddType({ everyday: 'everyday', ideas: 'idea' }[tab] || 'task');
    setShowAdd(true);
  };

  return (
    <div
      style={{
        fontFamily: '"Noto Sans KR",sans-serif',
        background: '#0c0c0f',
        height: '100dvh',
        color: '#e2e2ea',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{CSS}</style>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside
          className="sidebar"
          style={{
            width: 228,
            flexShrink: 0,
            borderRight: '1px solid #1a1a26',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#0e0e16',
          }}
        >
          <div
            style={{
              padding: '20px 18px 16px',
              borderBottom: '1px solid #1a1a26',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#f59e0b',
                letterSpacing: -1,
              }}
            >
              FOCUS
            </div>
            <div style={{ fontSize: 11, color: '#3a3a52', marginTop: 1 }}>
              할 일 관리 시스템
            </div>
          </div>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #1a1a26',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#f59e0b18',
                border: '2px solid #f59e0b40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: '#f59e0b',
                flexShrink: 0,
              }}
            >
              {user.displayName[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.displayName}
              </div>
              <div style={{ fontSize: 11, color: '#525265' }}>
                @{user.username}
              </div>
            </div>
            <button
              onClick={() => setUser(null)}
              title="로그아웃"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3a3a52',
                cursor: 'pointer',
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              ↩
            </button>
          </div>
          <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {TABS.map((t) => (
              <div
                key={t.id}
                className="nav-link"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: tab === t.id ? '#f59e0b' : '#6a6a82',
                  background: tab === t.id ? '#f59e0b08' : 'transparent',
                  borderLeft: `2px solid ${
                    tab === t.id ? '#f59e0b' : 'transparent'
                  }`,
                  fontSize: 13,
                  fontWeight: tab === t.id ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
                {t.badge > 0 && (
                  <span
                    style={{
                      background: '#f59e0b20',
                      color: '#f59e0b',
                      borderRadius: 10,
                      padding: '1px 7px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid #1a1a26', padding: '14px 18px' }}>
            <div
              onClick={() => setShowFriends(!showFriends)}
              style={{
                fontSize: 12,
                color: '#525265',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none',
              }}
            >
              <span>👥 친구 {friends.length}명</span>
              <span style={{ fontSize: 10 }}>{showFriends ? '▲' : '▼'}</span>
            </div>
            {showFriends && (
              <div style={{ marginTop: 10 }}>
                {friends.map((f) => (
                  <div
                    key={f.username}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '3px 0',
                      fontSize: 12,
                      color: '#7a7a92',
                    }}
                  >
                    <span>
                      • {f.displayName}{' '}
                      <span style={{ color: '#3a3a52' }}>@{f.username}</span>
                    </span>
                    <button
                      onClick={() => removeFriend(f.username)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#2a2a38',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {friends.length === 0 && (
                  <div
                    style={{ fontSize: 12, color: '#3a3a52', marginBottom: 8 }}
                  >
                    아직 친구가 없어요
                  </div>
                )}
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <input
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFriend()}
                    placeholder="아이디로 추가"
                    style={{
                      flex: 1,
                      background: '#0c0c0f',
                      border: '1px solid #2a2a38',
                      borderRadius: 7,
                      padding: '5px 8px',
                      color: '#e2e2ea',
                      fontSize: 11,
                    }}
                  />
                  <button
                    onClick={addFriend}
                    style={{
                      background: '#f59e0b',
                      border: 'none',
                      borderRadius: 7,
                      padding: '5px 10px',
                      color: '#0c0c0f',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    추가
                  </button>
                </div>
                {friendMsg && (
                  <div
                    style={{
                      fontSize: 11,
                      color: friendMsg.startsWith('⚠') ? '#ef4444' : '#f59e0b',
                      marginTop: 6,
                    }}
                  >
                    {friendMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main ── */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            className="mob-header"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1a1a26',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0e0e16',
              display: 'none',
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#f59e0b',
                letterSpacing: -1,
              }}
            >
              FOCUS
            </div>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a38',
                borderRadius: 8,
                padding: '6px 12px',
                color: '#7a7a92',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              👤 {user.displayName}
            </button>
          </div>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #1a1a26',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {TABS.find((t) => t.id === tab)?.icon}{' '}
                {TABS.find((t) => t.id === tab)?.label}
              </div>
              <div style={{ fontSize: 11, color: '#525265', marginTop: 2 }}>
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </div>
            </div>
            <button
              className="fab"
              onClick={openAdd}
              style={{
                background: '#f59e0b',
                border: 'none',
                borderRadius: 10,
                padding: '9px 18px',
                color: '#0c0c0f',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + 추가
            </button>
          </div>
          {tab === 'todo' && (
            <div
              style={{
                padding: '10px 20px',
                borderBottom: '1px solid #1a1a26',
                display: 'flex',
                gap: 6,
                flexShrink: 0,
                overflowX: 'auto',
              }}
            >
              {[
                ['today', '오늘'],
                ['week', '이번 주'],
                ['month', '이번 달'],
                ['year', '올해 전체'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className="pill-btn"
                  onClick={() => setFilter(v)}
                  style={{
                    padding: '5px 13px',
                    borderRadius: 20,
                    border: `1px solid ${filter === v ? '#f59e0b' : '#2a2a38'}`,
                    background: filter === v ? '#f59e0b' : 'transparent',
                    color: filter === v ? '#0c0c0f' : '#525265',
                    fontWeight: filter === v ? 600 : 400,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          <div
            style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}
          >
            {tab === 'todo' &&
              (fTodo.length === 0 ? (
                <Empty
                  icon="✨"
                  msg={
                    filter === 'today'
                      ? '오늘 할 일이 없어요!'
                      : '해당 기간에 할 일이 없어요'
                  }
                />
              ) : (
                fTodo.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onComplete={completeTask}
                    onDelete={deleteTask}
                    users={users}
                    currentUser={user.username}
                    showDeadline
                  />
                ))
              ))}
            {tab === 'everyday' &&
              (everyday.length === 0 ? (
                <Empty icon="🔄" msg="매일 반복할 일을 추가해보세요" />
              ) : (
                everyday.map((t) => (
                  <EverydayCard
                    key={t.id}
                    task={t}
                    onCheck={checkEveryday}
                    onDelete={deleteTask}
                    currentUser={user.username}
                    users={users}
                  />
                ))
              ))}
            {tab === 'dontforget' &&
              (dontforget.length === 0 ? (
                <Empty icon="⚡" msg="잊으면 안 되는 일이 없어요!" />
              ) : (
                dontforget.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onComplete={completeTask}
                    onDelete={deleteTask}
                    users={users}
                    currentUser={user.username}
                  />
                ))
              ))}
            {tab === 'completed' &&
              (completed.length === 0 ? (
                <Empty icon="📭" msg="완료한 일이 없어요" />
              ) : (
                [...completed]
                  .sort((a, b) =>
                    (b.completedAt || '').localeCompare(a.completedAt || '')
                  )
                  .map((t) => <CompletedCard key={t.id} task={t} />)
              ))}
            {tab === 'ideas' &&
              (ideas.length === 0 ? (
                <Empty icon="💡" msg="번뜩이는 아이디어를 기록해보세요" />
              ) : (
                [...ideas]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((t) => (
                    <IdeaCard key={t.id} task={t} onDelete={deleteTask} />
                  ))
              ))}
          </div>
        </main>
      </div>

      {/* ── 모바일 하단 탭 ── */}
      <div
        className="bot-nav"
        style={{
          borderTop: '1px solid #1a1a26',
          justifyContent: 'space-around',
          background: '#0e0e16',
          flexShrink: 0,
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'none',
        }}
      >
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              padding: '8px 0',
              color: tab === t.id ? '#f59e0b' : '#525265',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 600 : 400 }}>
              {t.label}
            </span>
            {t.badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: '50%',
                  transform: 'translateX(65%)',
                  background: '#f59e0b',
                  color: '#0c0c0f',
                  borderRadius: 10,
                  padding: '0px 5px',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {t.badge}
              </span>
            )}
          </div>
        ))}
        <div
          onClick={openAdd}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            padding: '8px 0',
            color: '#f59e0b',
          }}
        >
          <span
            style={{
              fontSize: 20,
              background: '#f59e0b',
              color: '#0c0c0f',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            +
          </span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>추가</span>
        </div>
      </div>

      {showAdd && (
        <AddModal
          initType={addType}
          onAdd={addTask}
          onClose={() => setShowAdd(false)}
          friends={friends}
        />
      )}
      {showSettings && (
        <SettingsModal
          user={user}
          users={users}
          friends={friends}
          friendInput={friendInput}
          setFriendInput={setFriendInput}
          onAddFriend={addFriend}
          onRemoveFriend={removeFriend}
          onLogout={() => {
            setUser(null);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
          friendMsg={friendMsg}
        />
      )}
    </div>
  );
}

import DemoSection from '../components/DemoSection'

function React19Features() {
  const comparisonStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    margin: '20px 0'
  }

  const comparisonItemStyle = {
    background: '#fafafa',
    padding: '15px',
    borderRadius: '4px'
  }

  return (
    <div>
      <div className="page-header">
        <h1>React 19 新特性</h1>
        <p className="description">
          本页面展示 React 19 的主要新特性和改进（概念演示）。
          <br/>注意：部分特性需要 React 19 才能运行，当前使用 React 18 演示概念。
        </p>
      </div>

      {/* React Compiler */}
      <DemoSection title="1. React Compiler（自动优化）">
        <div className="info">
          <strong>最大变革：</strong>编译器自动优化你的代码，不再需要手动使用 memo/useMemo/useCallback！
        </div>

        <div style={comparisonStyle}>
          <div style={{...comparisonItemStyle, borderLeft: '3px solid #ff4d4f'}}>
            <h4 style={{ marginBottom: '10px' }}>❌ React 18（手动优化）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`const Component = React.memo(({ data }) => {
  const processed = useMemo(
    () => processData(data),
    [data]
  );
  
  const handler = useCallback(() => {
    handleClick();
  }, []);
  
  return <Child data={processed} onClick={handler} />;
});`}</pre>
          </div>

          <div style={{...comparisonItemStyle, borderLeft: '3px solid #52c41a'}}>
            <h4 style={{ marginBottom: '10px' }}>✅ React 19（编译器自动优化）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`function Component({ data }) {
  // 编译器自动缓存
  const processed = processData(data);
  const handler = () => handleClick();
  
  return <Child data={processed} onClick={handler} />;
}

// 编译器生成的代码会自动插入必要的缓存逻辑`}</pre>
          </div>
        </div>

        <ul style={{ lineHeight: '2', marginTop: '15px' }}>
          <li>✨ 编译时分析依赖关系，自动插入缓存逻辑</li>
          <li>✨ 代码更简洁，心智负担更低</li>
          <li>✨ 避免手动优化的错误（如忘记依赖项）</li>
          <li>✨ 性能比手动优化更好（编译器更智能）</li>
        </ul>
      </DemoSection>

      {/* Actions */}
      <DemoSection title="2. Actions（表单处理增强）">
        <div className="info">
          <strong>新增 Hooks：</strong>useActionState、useFormStatus、useOptimistic 简化异步表单处理。
        </div>

        <div style={comparisonStyle}>
          <div style={{...comparisonItemStyle, borderLeft: '3px solid #ff4d4f'}}>
            <h4 style={{ marginBottom: '10px' }}>❌ React 18（手动管理状态）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`function AddTodo() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await addTodo(new FormData(e.target));
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      <button disabled={pending}>
        {pending ? 'Adding...' : 'Add'}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}`}</pre>
          </div>

          <div style={{...comparisonItemStyle, borderLeft: '3px solid #52c41a'}}>
            <h4 style={{ marginBottom: '10px' }}>✅ React 19（使用 Actions）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`function AddTodo() {
  const [state, submitAction, isPending] = 
    useActionState(async (prevState, formData) => {
      try {
        await addTodo(formData);
        return { success: true };
      } catch (err) {
        return { error: err.message };
      }
    }, { success: false });
  
  return (
    <form action={submitAction}>
      <input name="title" />
      <button disabled={isPending}>
        {isPending ? 'Adding...' : 'Add'}
      </button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}`}</pre>
          </div>
        </div>

        <ul style={{ lineHeight: '2', marginTop: '15px' }}>
          <li>✨ 自动管理 loading 状态（isPending）</li>
          <li>✨ 自动处理表单提交</li>
          <li>✨ 支持乐观更新（useOptimistic）</li>
          <li>✨ 代码更简洁，错误处理更优雅</li>
        </ul>
      </DemoSection>

      {/* use() API */}
      <DemoSection title="3. use() API（统一资源读取）">
        <div className="info">
          <strong>功能：</strong>在组件中读取 Promise 或 Context，自动触发 Suspense。
        </div>

        <pre>{`// 读取 Promise
function UserProfile({ userPromise }) {
  const user = use(userPromise); // 等待 Promise 完成
  return <div>{user.name}</div>;
}

// 条件读取 Context（React 19 新能力）
function ThemedComponent({ isDark }) {
  const theme = use(isDark ? DarkThemeContext : LightThemeContext);
  return <div style={theme}>Content</div>;
}

// 与 Suspense 配合
<Suspense fallback={<Loading />}>
  <UserProfile userPromise={fetchUser(123)} />
</Suspense>`}</pre>

        <ul style={{ lineHeight: '2', marginTop: '15px' }}>
          <li>✨ 可以在条件语句中使用（突破 Hooks 限制）</li>
          <li>✨ 自动触发 Suspense</li>
          <li>✨ 统一 Promise 和 Context 的读取方式</li>
        </ul>
      </DemoSection>

      {/* ref as prop */}
      <DemoSection title="4. ref 作为 prop（简化 ref 传递）">
        <div className="info">
          <strong>改进：</strong>不再需要 forwardRef，ref 可以直接作为 prop 传递。
        </div>

        <div style={comparisonStyle}>
          <div style={{...comparisonItemStyle, borderLeft: '3px solid #ff4d4f'}}>
            <h4 style={{ marginBottom: '10px' }}>❌ React 18（需要 forwardRef）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`const Input = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// 使用
<Input ref={inputRef} />`}</pre>
          </div>

          <div style={{...comparisonItemStyle, borderLeft: '3px solid #52c41a'}}>
            <h4 style={{ marginBottom: '10px' }}>✅ React 19（直接使用）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// 使用
<Input ref={inputRef} />`}</pre>
          </div>
        </div>
      </DemoSection>

      {/* Document Metadata */}
      <DemoSection title="5. Document Metadata（内置 SEO 支持）">
        <div className="info">
          <strong>改进：</strong>组件中直接管理 title、meta 标签，不再需要 react-helmet。
        </div>

        <div style={comparisonStyle}>
          <div style={{...comparisonItemStyle, borderLeft: '3px solid #ff4d4f'}}>
            <h4 style={{ marginBottom: '10px' }}>❌ React 18（需要 react-helmet）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`import { Helmet } from 'react-helmet';

function BlogPost({ post }) {
  return (
    <>
      <Helmet>
        <title>{post.title}</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>
      <article>{post.content}</article>
    </>
  );
}`}</pre>
          </div>

          <div style={{...comparisonItemStyle, borderLeft: '3px solid #52c41a'}}>
            <h4 style={{ marginBottom: '10px' }}>✅ React 19（原生支持）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`function BlogPost({ post }) {
  return (
    <>
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <article>{post.content}</article>
    </>
  );
}

// React 自动提升到 <head> 中`}</pre>
          </div>
        </div>
      </DemoSection>

      {/* 资源预加载 */}
      <DemoSection title="6. 资源预加载 API">
        <div className="info">
          <strong>新增：</strong>preload、preinit、prefetchDNS、preconnect 等 API。
        </div>

        <pre>{`import { preload, preinit, prefetchDNS, preconnect } from 'react-dom';

function ProductPage({ productId }) {
  useEffect(() => {
    // 预加载图片
    preload(\`/products/\${productId}/hero.jpg\`, { as: 'image' });
    
    // 预初始化脚本
    preinit('/analytics.js', { as: 'script' });
    
    // DNS 预解析
    prefetchDNS('https://api.example.com');
    
    // 预连接
    preconnect('https://cdn.example.com');
  }, [productId]);
  
  return <div>Product {productId}</div>;
}

// 自动生成 <link rel="preload"> 等标签`}</pre>
      </DemoSection>

      {/* 其他改进 */}
      <DemoSection title="7. 其他重要改进">
        <ul style={{ lineHeight: '2' }}>
          <li>✨ <strong>Context 性能优化：</strong>自动选择性订阅，只有使用的值变化才重渲染</li>
          <li>✨ <strong>Suspense 增强：</strong>更好的错误处理和 onError 回调</li>
          <li>✨ <strong>Server Components 稳定：</strong>React Server Components 正式稳定</li>
          <li>✨ <strong>并发渲染优化：</strong>更智能的优先级调度</li>
          <li>✨ <strong>useMemo/useCallback 改进：</strong>即使不写依赖数组也能正确工作</li>
        </ul>
      </DemoSection>

      {/* 升级建议 */}
      <DemoSection title="8. 升级建议">
        <div className="info">
          <strong>渐进式升级：</strong>
          <br/>1. React 18 → React 19：大部分代码无需修改
          <br/>2. 启用 React Compiler：逐步移除手动的 memo/useMemo/useCallback
          <br/>3. 使用新 API：在新功能中使用 Actions、use() 等新特性
          <br/>4. 性能测试：升级后进行充分的性能测试
        </div>

        <pre>{`// 安装 React 19（稳定版发布后）
npm install react@19 react-dom@19

// 启用 React Compiler
npm install babel-plugin-react-compiler
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      target: '18' // 向下兼容
    }]
  ]
};`}</pre>
      </DemoSection>
    </div>
  )
}

export default React19Features


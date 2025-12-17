export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Axite MCP Template</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
          This is the default landing page. Your specific widgets live at their respective paths (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/widgets/hello-world</code>).
        </p>
        <p className="text-sm text-gray-500">
          The MCP Server is active at <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/mcp</code>
        </p>
      </main>
    </div>
  );
}

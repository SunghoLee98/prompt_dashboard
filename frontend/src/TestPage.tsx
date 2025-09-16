import React from 'react';

export const TestPage: React.FC = () => {
  const [testResults, setTestResults] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    const results = [];
    
    // Test 1: Check if React is loaded
    results.push({
      name: 'React loaded',
      success: !!React,
      value: React ? 'Yes' : 'No'
    });
    
    // Test 2: Check if routing works
    results.push({
      name: 'Current path',
      success: true,
      value: window.location.pathname
    });
    
    // Test 3: Check localStorage
    results.push({
      name: 'LocalStorage accessible',
      success: !!window.localStorage,
      value: window.localStorage ? 'Yes' : 'No'
    });
    
    // Test 4: Check API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';
    results.push({
      name: 'API URL configured',
      success: true,
      value: apiUrl
    });
    
    setTestResults(results);
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Frontend Test Page</h1>
      <div className="space-y-2">
        {testResults.map((test, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className={test.success ? 'text-green-500' : 'text-red-500'}>
              {test.success ? '✅' : '❌'}
            </span>
            <span className="font-semibold">{test.name}:</span>
            <span>{test.value}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Quick Navigation</h2>
        <div className="space-x-4">
          <a href="/" className="text-blue-500 hover:underline">Home</a>
          <a href="/login" className="text-blue-500 hover:underline">Login</a>
          <a href="/register" className="text-blue-500 hover:underline">Register</a>
          <a href="/prompts" className="text-blue-500 hover:underline">Prompts</a>
        </div>
      </div>
    </div>
  );
};
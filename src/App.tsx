import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType, Database, Lock } from 'lucide-react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState<'noise' | 'ml'>('noise');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    nonPrivateAccuracy?: number;
    privateAccuracy?: number;
  }>({});

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  });

  const [noiseForm, setNoiseForm] = useState({
    private: '',
    binary: '',
    categorical: '',
    numerical: '',
    epsilon: ''
  });

  const [mlForm, setMlForm] = useState({
    colinp: '',
    colop: '',
    mlalgo: '1',
    traintest: '',
    mlpara: ''
  });

  const handleNoiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('csvfile', file);
    Object.entries(noiseForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await axios.post('http://localhost:5000/', formData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `private_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to process the file. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('csvfile', file);
    Object.entries(mlForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await axios.post('http://localhost:5000/', formData);
      setResults({
        nonPrivateAccuracy: response.data.accuracy1,
        privateAccuracy: response.data.accuracy2
      });
    } catch (err) {
      setError('Failed to process the file. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            IBM Differential Privacy Application
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('noise')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'noise'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dataset Noise Addition
            </button>
            <button
              onClick={() => setActiveTab('ml')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'ml'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ML Accuracies Comparison
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-1 text-sm text-gray-600">
                Drop a CSV file here, or click to select
              </p>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <FileType className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{file.name}</span>
                </div>
              </div>
            )}

            {activeTab === 'noise' ? (
              <form onSubmit={handleNoiseSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Private Columns (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={noiseForm.private}
                    onChange={(e) => setNoiseForm({ ...noiseForm, private: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Binary Columns (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={noiseForm.binary}
                    onChange={(e) => setNoiseForm({ ...noiseForm, binary: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categorical Columns (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={noiseForm.categorical}
                    onChange={(e) => setNoiseForm({ ...noiseForm, categorical: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Numerical Columns (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={noiseForm.numerical}
                    onChange={(e) => setNoiseForm({ ...noiseForm, numerical: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Epsilon, Delta, Sensitivity (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={noiseForm.epsilon}
                    onChange={(e) => setNoiseForm({ ...noiseForm, epsilon: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Add Noise'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMLSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Input Columns (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={mlForm.colinp}
                    onChange={(e) => setMlForm({ ...mlForm, colinp: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Output Column
                  </label>
                  <input
                    type="text"
                    value={mlForm.colop}
                    onChange={(e) => setMlForm({ ...mlForm, colop: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ML Algorithm
                  </label>
                  <select
                    value={mlForm.mlalgo}
                    onChange={(e) => setMlForm({ ...mlForm, mlalgo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="1">Classification</option>
                    <option value="2">Regression</option>
                    <option value="3">Clustering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Train/Test Split (comma-separated percentages)
                  </label>
                  <input
                    type="text"
                    value={mlForm.traintest}
                    onChange={(e) => setMlForm({ ...mlForm, traintest: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Epsilon, L2 Norm, Clusters (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={mlForm.mlpara}
                    onChange={(e) => setMlForm({ ...mlForm, mlpara: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Compare Accuracies'}
                </button>
              </form>
            )}

            {results.nonPrivateAccuracy !== undefined && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900">Non-Private Accuracy</h3>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {(results.nonPrivateAccuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900">Private Accuracy</h3>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {(results.privateAccuracy * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
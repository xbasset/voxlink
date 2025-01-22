import React, { useState, useEffect } from 'react';
import { Call, User } from '../types/db';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Dashboard: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch calls when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchCalls();
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
      // Optionally set the first user as default
      if (data.length > 0) {
        setSelectedUserId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCalls = async () => {
    try {
      const response = await fetch(`/api/calls?userId=${selectedUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }
      const data = await response.json();
      setCalls(data);
    } catch (error) {
      console.error('Error fetching calls:', error);
    }
  };

  const toggleTranscript = (callId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(callId)) {
      newExpandedRows.delete(callId);
    } else {
      newExpandedRows.add(callId);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900">Call History</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all calls recorded by the system including their date, duration, and details.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <div className="flex items-center gap-2">
              <label htmlFor="user-select" className="text-sm font-medium text-gray-700">
                Select User:
              </label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="block rounded-md border-gray-300 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8">
                      Date
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                      Duration
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                      Name
                    </th>
                    <th scope="col" className="sticky top-0 z-10 hidden border-b border-gray-300 bg-white/75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell">
                      Reason
                    </th>
                    <th scope="col" className="sticky top-0 z-10 hidden border-b border-gray-300 bg-white/75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell">
                      Email
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                      Phone
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/75 py-3.5 pl-3 pr-4 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8">
                      <span className="sr-only">Transcript</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No calls found for this user
                      </td>
                    </tr>
                  ) : (
                    calls.map((call, callIdx) => (
                      <React.Fragment key={call.id}>
                        <tr>
                          <td className={classNames(
                            callIdx !== calls.length - 1 ? 'border-b border-gray-200' : '',
                            'whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 lg:pl-8'
                          )}>
                            {formatDate(call.timestamp)}
                          </td>
                          <td className={classNames(
                            callIdx !== calls.length - 1 ? 'border-b border-gray-200' : '',
                            'whitespace-nowrap px-3 py-4 text-sm text-gray-500'
                          )}>
                            {formatDuration(call.duration)}
                          </td>
                          <td className={classNames(
                            callIdx !== calls.length - 1 ? 'border-b border-gray-200' : '',
                            'whitespace-nowrap px-3 py-4 text-sm text-gray-500'
                          )}>
                            {call.details.name || '-'}
                          </td>
                          <td className={classNames(
                            callIdx !== calls.length - 1 ? 'border-b border-gray-200' : '',
                            'hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell'
                          )}>
                            {call.details.reason || '-'}
                          </td>
                          <td className={classNames(
                            callIdx !== calls.length - 1 ? 'border-b border-gray-200' : '',
                            'hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell'
                          )}>
                            {call.details.email || '-'}
                          </td>
                          <td className={classNames(
                            callIdx !== calls.length - 1 ? 'border-b border-gray-200' : '',
                            'whitespace-nowrap px-3 py-4 text-sm text-gray-500'
                          )}>
                            {call.details.phone || '-'}
                          </td>
                          <td className={classNames(
                            callIdx !== calls.length - 1 ? 'border-b border-gray-200' : '',
                            'relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8'
                          )}>
                            <button
                              onClick={() => toggleTranscript(call.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {expandedRows.has(call.id) ? (
                                <>
                                  Hide <ChevronUpIcon className="inline-block ml-1 h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Show <ChevronDownIcon className="inline-block ml-1 h-4 w-4" />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedRows.has(call.id) && (
                          <tr>
                            <td colSpan={7} className="px-8 py-4 bg-gray-50">
                              <div className="space-y-2">
                                {call.transcript.map((entry) => (
                                  <div
                                    key={entry.itemId}
                                    className={`flex gap-2 ${
                                      entry.from === 'assistant' ? 'text-blue-600' : 'text-green-600'
                                    }`}
                                  >
                                    <span className="font-semibold min-w-[80px]">
                                      {entry.from === 'assistant' ? 'Assistant:' : 'User:'}
                                    </span>
                                    <span className="flex-1 text-sm">{entry.content}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
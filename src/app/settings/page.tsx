'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'running' | 'pending';
    duration?: number;
    error?: string;
    details?: any;
    logs?: string[];
}

interface TestSuite {
    name: string;
    tests: TestResult[];
    status: 'pass' | 'fail' | 'running' | 'pending';
}

export default function SettingsPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
    const [overallStatus, setOverallStatus] = useState<'pass' | 'fail' | 'running' | 'pending'>('pending');
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);

    const runTests = async () => {
        setIsRunning(true);
        setStartTime(new Date());
        setEndTime(null);
        setOverallStatus('running');
        setTestSuites([]);

        try {
            const response = await fetch('/api/settings/run-tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();
            
            setTestSuites(data.suites || []);
            setOverallStatus(data.overallStatus || 'fail');
            setEndTime(new Date());
        } catch (error: any) {
            console.error('Failed to run tests:', error);
            setTestSuites([{
                name: 'Error',
                status: 'fail',
                tests: [{
                    name: 'Test Runner',
                    status: 'fail',
                    error: error.message || 'Failed to run tests',
                }],
            }]);
            setOverallStatus('fail');
            setEndTime(new Date());
        } finally {
            setIsRunning(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pass':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'fail':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'running':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
            pass: 'default',
            fail: 'destructive',
            running: 'secondary',
            pending: 'secondary',
        };

        return (
            <Badge variant={variants[status] || 'secondary'} className="ml-2">
                {status.toUpperCase()}
            </Badge>
        );
    };

    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = testSuites.reduce(
        (sum, suite) => sum + suite.tests.filter(t => t.status === 'pass').length,
        0
    );
    const failedTests = testSuites.reduce(
        (sum, suite) => sum + suite.tests.filter(t => t.status === 'fail').length,
        0
    );

    const duration = startTime && endTime 
        ? ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)
        : null;

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex items-center gap-3 mb-6">
                <Settings className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Settings & Diagnostics</h1>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Production Test Runner</CardTitle>
                    <CardDescription>
                        Run comprehensive tests against the production deployment to diagnose issues.
                        Tests all API endpoints, authentication, and core functionality.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            onClick={runTests}
                            disabled={isRunning}
                            size="lg"
                            className="flex items-center gap-2"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Running Tests...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    Run Production Tests
                                </>
                            )}
                        </Button>

                        {overallStatus !== 'pending' && (
                            <div className="flex items-center gap-2">
                                {getStatusIcon(overallStatus)}
                                {getStatusBadge(overallStatus)}
                            </div>
                        )}

                        {duration && (
                            <span className="text-sm text-muted-foreground">
                                Completed in {duration}s
                            </span>
                        )}
                    </div>

                    {testSuites.length > 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="text-2xl font-bold">{totalTests}</div>
                                    <div className="text-sm text-muted-foreground">Total Tests</div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {passedTests}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Passed</div>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {failedTests}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Failed</div>
                                </div>
                            </div>

                            {testSuites.map((suite, suiteIndex) => (
                                <Card key={suiteIndex} className="border-l-4 border-l-primary">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{suite.name}</CardTitle>
                                            {getStatusBadge(suite.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {suite.tests.map((test, testIndex) => (
                                                <div
                                                    key={testIndex}
                                                    className="p-4 border rounded-lg bg-card"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(test.status)}
                                                            <span className="font-medium">{test.name}</span>
                                                        </div>
                                                        {test.duration && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {test.duration}ms
                                                            </span>
                                                        )}
                                                    </div>

                                                    {test.error && (
                                                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                                            <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                                                Error:
                                                            </div>
                                                            <div className="text-sm text-red-700 dark:text-red-300 font-mono">
                                                                {test.error}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {test.logs && test.logs.length > 0 && (
                                                        <div className="mt-2 p-3 bg-muted rounded">
                                                            <div className="text-xs font-medium mb-1">Logs:</div>
                                                            <div className="text-xs font-mono space-y-1">
                                                                {test.logs.map((log, logIndex) => (
                                                                    <div key={logIndex} className="text-muted-foreground">
                                                                        {log}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {test.details && (
                                                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                                            <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                                                                Details:
                                                            </div>
                                                            <pre className="text-xs text-blue-700 dark:text-blue-300 overflow-x-auto">
                                                                {JSON.stringify(test.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


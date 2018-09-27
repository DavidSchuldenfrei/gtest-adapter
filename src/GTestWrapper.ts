import { DebugConfiguration,workspace, debug, window, commands, ConfigurationTarget } from 'vscode';
import { ChildProcess, spawn, execSync } from 'child_process';
import { tmpdir } from 'os';
import { Controller } from './Controller';
import { existsSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { Status, TestNode } from './TestNode';
import { RunStatus } from './RunStatus';
import { JsonEntry } from './JsonOutputs';
import { TestLocation } from './TestLocation';

export class GTestWrapper {
    private _passedTests: number;
    private _failedTests: number;
    private _runner: ChildProcess | undefined;

    constructor(private controller: Controller) {
        this._passedTests = 0;
        this._failedTests = 0;
    }


    public runAllTests() {
        this.runTestByName('*');
    }  
    
    public runTestByName(testName: string) {
        this.stopRun();
        this._passedTests = 0;
        this._failedTests = 0;
        setTimeout(() => this.realRunTestByName(testName), 500); //Adding this timeout allows time to clear tree icons
    }

    private realRunTestByName(testName: string) {
        const args: ReadonlyArray<string> = ['--gtest_filter=' + testName];
        const config = this.getTestsConfig();
        if (!config)
            return;
        this._runner = spawn(config.program, args, { detached: true, cwd: this.getWorkspaceFolder(), env: config.env });
        this._runner.stdout.on('data', data => {
            var dataStr = '';
            if (typeof (data) == 'string') {
                dataStr = data as string;
            } else {
                dataStr = (data as Buffer).toString();
            }
            var lines = dataStr.split(/[\r\n]+/g);
            lines.forEach(line => {
                if (line.startsWith('[       OK ]') && line.endsWith(')')) {
                    this.controller.setTestStatus(GTestWrapper.getTestName(line), Status.Passed);
                    if (!this._passedTests)
                        this._passedTests = 0;
                    this._passedTests++;
                } else if (line.startsWith('[  FAILED  ]')  && line.endsWith(')')) {
                    this.controller.setTestStatus(GTestWrapper.getTestName(line), Status.Failed);
                    this._failedTests++;
                }
            });
            this.controller.refreshDisplay(RunStatus.Running, this._passedTests, this._failedTests + this._passedTests);
        });
        this._runner.on('exit', code => {
            this.controller.refreshDisplay(RunStatus.RunCompleted, this._passedTests, this._failedTests + this._passedTests);
        });
        this.controller.refreshDisplay(RunStatus.Running, this._passedTests, this._failedTests + this._passedTests);
    }

    public debugTest(testName: string) {
        var debugConfig = this.getDebugConfig();
        if (workspace.workspaceFolders && debugConfig) {
            debugConfig.args = ['--gtest_filter=' + testName];
            debug.startDebugging(workspace.workspaceFolders[0], debugConfig);
            commands.executeCommand('workbench.view.debug');
        }
    }

    public stopRun() {
        if (this._runner)
            this._runner.kill();
        this.controller.refreshDisplay(RunStatus.RunCompleted, this._passedTests, this._failedTests + this._passedTests);
    }

    public reload() {
        this._passedTests = 0;
        this._failedTests = 0;
    }

    public switchConfig() {
        const debugConfigs = workspace.getConfiguration("launch").get("configurations") as Array<CppDebugConfig>;
        if (debugConfigs.length == 0) {
            window.showErrorMessage(`You first need to define a debug configuration, for your tests`);
        } else {
            var options: string[] = [];
            debugConfigs.forEach(s => options.push(s.name));
            window.showInformationMessage(`Select a debug configuration, for your tests`, ...options)
                .then(s => {
                    if (s) {
                        workspace.getConfiguration().update("gtest-adapter.debugConfig", s, ConfigurationTarget.Workspace);
                        this.controller.reloadAll();
                    }
                });
        }
    }   

    private getDebugConfig(): CppDebugConfig | undefined {
        const debugConfigName = workspace.getConfiguration("gtest-adapter").get<string>("debugConfig");
        const debugConfigs = workspace.getConfiguration("launch").get("configurations") as Array<CppDebugConfig>;
        return debugConfigs.find(config => { return config.name == debugConfigName; });
    }

    private getTestsConfig(): TestConfig | undefined {
        var debugConfig = this.getDebugConfig();
        if (!debugConfig) {
            const debugConfigs = workspace.getConfiguration("launch").get("configurations") as Array<CppDebugConfig>;
            if (debugConfigs.length == 0) {
                window.showErrorMessage(`You first need to define a debug configuration, for your tests`);
            } else {
                var options: string[] = [];
                debugConfigs.forEach(s => options.push(s.name));
                window.showErrorMessage(`You first need to select a debug configuration, for your tests`, ...options)
                    .then(s => {
                        if (s) {
                            workspace.getConfiguration().update("gtest-adapter.debugConfig", s, ConfigurationTarget.Workspace);
                            this.controller.reloadAll();
                        }
                    });
            }
        }
        if (!debugConfig) {
            return undefined;
        }

        var workspaceFolder = this.getWorkspaceFolder();
        var testConfig = debugConfig.program;
        testConfig = testConfig.replace("${workspaceFolder}", workspaceFolder);
        testConfig = testConfig.replace("${workspaceRoot}", workspaceFolder); //Deprecated but might still be used.
        const testApp = resolve(workspaceFolder, testConfig);
        if (!existsSync(testApp)) {
            window.showErrorMessage("You need to first build the unit test app");
            return undefined;
        }
        var env = process.env;

        if (debugConfig.environment) {
            env = JSON.parse(JSON.stringify(process.env));
            debugConfig.environment.forEach(entry => {
                if (entry.name != undefined && entry.value != undefined) {
                    env[entry.name] = entry.value;
                }
            });
        }
        return new TestConfig(testApp, env);
    }

    private getWorkspaceFolder(): string {
        const folders = workspace.workspaceFolders;
        if (!folders || folders.length == 0)
            return '';
        const uri = folders[0].uri;
        return uri.fsPath;
    }

    private static getTestName(lineResult: string): string {
        return lineResult.substring(12).trim().split(' ')[0].replace(',', '');
    }

    public loadTestsRootAsync(): Thenable<TestNode | undefined> {
        var filename = 'tmp' + Math.floor(1000000 * Math.random()) + Date.now() + '.json';
        filename = join(tmpdir(), filename);
        return this.loadTestLines(filename).then((fullNames: string[]) => {
            if (fullNames.length == 0) {
                if (existsSync(filename)) {
                    unlinkSync(filename);
                }
                return undefined;
            }
            return this.loadTestsRoot(fullNames, filename);
        });
    }

    private loadTestLines(filename: string): Thenable<string[]> {
        return new Promise((c, e) => {
            const config = this.getTestsConfig();
            if (!config)
                return c([]);            
            var results = execSync(config.program + '  --gtest_list_tests --gtest_output=json:' + filename, { encoding: "utf8", env: config.env })
                .split(/[\r\n]+/g);
            results = results.filter(s => s != null && s.trim() != "");
            c(results);
            return c([]);
        });
    }

    private loadTestsRoot(tests: string[], filename: string): TestNode {
        var root = new TestNode(undefined, "", "Tests")
        var current = root;
        var currentName = "";
        for (var i = 0; i < tests.length; ++i) {
            var currentTestLine = tests[i];
            if (currentTestLine.startsWith(" ")) {
                current.addChild(new TestNode(current, currentName, currentTestLine));
            } else {
                var indexOfSlash = currentTestLine.indexOf("/");
                if (indexOfSlash > 0) {
                    var startOfLine = currentTestLine.substring(0, indexOfSlash + 1);
                    var first = new TestNode(root, "", startOfLine);
                    var firstNode = root.addChild(first);
                    var second = new TestNode(firstNode, startOfLine, currentTestLine.substring(indexOfSlash + 1));
                    current = firstNode.addChild(second);
                    currentName = currentTestLine;
                } else {
                    var node = new TestNode(root, "", currentTestLine);
                    current = root.addChild(node);
                    currentName = currentTestLine;
                }
            }
        }
        if (existsSync(filename)) {
            workspace.getConfiguration().update("gtest-adapter.supportLocation", true, ConfigurationTarget.Workspace);

            var content = require(filename) as JsonEntry;
            var locations = new Map<string, TestLocation>();
            content.testsuites.forEach(testSuite => {
                testSuite.testsuite.forEach(test => {
                    var fullName = testSuite.name + '.' + test.name;
                    var location = new TestLocation(test.file, test.line);
                    locations.set(fullName, location);
                })
            });

            this.fillLeaves(root, locations);

            unlinkSync(filename);
        } else {
            workspace.getConfiguration().update("gtest-adapter.supportLocation", false, ConfigurationTarget.Workspace);
        }
        this.controller.notifyTreeLoaded(root);
        return root;
    }

    private fillLeaves(root: TestNode, locations: Map<string, TestLocation>) {
        var children = root.children;
        if (children.length == 0) {
            root.location = locations.get(root.fullName);
        } else {
            children.forEach(child => this.fillLeaves(child, locations));
        }
    }

}

interface CppDebugConfig extends DebugConfiguration {
    program: string;
    args?: string[];
    environment?:any[];
}

class TestConfig {
    constructor (public program: string, public env?: any) {        
    }
}
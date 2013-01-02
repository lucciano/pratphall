///<reference path='pratphall.ts' />

module Pratphall {

    export class PhpEmitOptions {
        //When true (default), this will always use single quotes unless there is an escape character.
        //When false, this will use what was used in JS unless there is an escape character.
        alwaysPreferSingleQuotes = true;

        //String per indent (default is 4 spaces)
        indent = '    ';

        //Preserve comments?
        comments = true;

        //When true, any identifier that's all caps is assumed a const
        allCapsConsts = false;

        //When true, type hints are emitted
        typeHint = true;

        //When true, nested namespaces are allowed
        nestedNamespaces = true;

        //When true, no top-level functions or vars or code, only type decls
        typeDeclarationsOnly = true;

        //When true, elseif is used instead of "else if"
        useElseif = false;
    }

    export interface AstMatcher {
        nodeType: TypeScript.NodeType[];
        priority: number;
        typePropertyMatches?: {};
        propertyMatches?: {};
    }
        
    export interface EmitterExtension {
        name: string;
        description: string;
        matcher: AstMatcher;
        emit(ast: TypeScript.AST, emitter: PhpEmitter): bool;
    }

    export class EmitterError {
        constructor(public message: string, public line: number, public col: number) { }
    }

    export class PhpEmitter {

        static extensionsByNodeType: EmitterExtension[][] = [];
        
        static registerExtension(extension: EmitterExtension) {
            var arr: EmitterExtension[];
            extension.matcher.nodeType.forEach((value: TypeScript.NodeType) => {
                if (typeof extensionsByNodeType[value] === 'undefined') {
                    arr = extensionsByNodeType[value] = [];
                } else {
                    arr = extensionsByNodeType[value];
                }
                arr.push(extension);
                //re-sort
                arr.sort((a: EmitterExtension, b: EmitterExtension) => {
                    if (a.matcher.priority < b.matcher.priority) return -1;
                    else if (a.matcher.priority == b.matcher.priority) return 0;
                    else return 1;
                });
            });
        }

        private indent = 0;
        private currStr = '';
        private stack: TypeScript.AST[] = [];
        skipNextSemicolon = false;
        errors: EmitterError[] = [];
        warnings: EmitterError[] = [];
        private tempVarCounter = 0;

        constructor(private checker: TypeScript.TypeChecker, 
            public options?: PhpEmitOptions = new PhpEmitOptions()) {
        }

        getContents() { return this.currStr; }

        write(val: string) {
            //this.out.Write(val);
            this.currStr += val;
            return this;
        }

        semicolon(lastAst: TypeScript.AST) {
            if (this.skipNextSemicolon) this.skipNextSemicolon = false;
            else if (lastAst == null || this.hasSemicolonAfterStatement(lastAst)) this.write(';');
            return this;
        }

        increaseIndent() {
            this.indent++;
            return this;
        }

        decreaseIndent() {
            this.indent--;
            return this;
        }

        newline(indent = true) {
            this.write('\n');
            if (indent) this.write(Array(this.indent + 1).join(this.options.indent));
            return this;
        }

        emit(ast: TypeScript.AST) {
            this.stack.push(ast);
            //check extension first
            if (this.extensionHandled(ast)) { /*no-op*/ }
            else {
                //parens?
                if (ast.isParenthesized) this.write('(');
                if (ast instanceof TypeScript.ArgDecl) this.emitArgDecl(<TypeScript.ArgDecl>ast);
                else if (ast instanceof TypeScript.BinaryExpression) this.emitBinaryExpression(<TypeScript.BinaryExpression>ast);
                else if (ast instanceof TypeScript.Block) this.emitBlock(<TypeScript.Block>ast);
                else if (ast instanceof TypeScript.CallExpression) this.emitCallExpression(<TypeScript.CallExpression>ast);
                else if (ast instanceof TypeScript.CaseStatement) this.emitCaseStatement(<TypeScript.CaseStatement>ast);
                else if (ast instanceof TypeScript.Catch) this.emitCatch(<TypeScript.Catch>ast);
                else if (ast instanceof TypeScript.ClassDeclaration) this.emitClassDeclaration(<TypeScript.ClassDeclaration>ast);
                else if (ast instanceof TypeScript.Comment) this.emitComment(<TypeScript.Comment>ast);
                else if (ast instanceof TypeScript.ConditionalExpression) this.emitConditionalExpression(<TypeScript.ConditionalExpression>ast);
                else if (ast instanceof TypeScript.DoWhileStatement) this.emitDoWhileStatement(<TypeScript.DoWhileStatement>ast);
                else if (ast instanceof TypeScript.EndCode) { /*no-op*/ }
                else if (ast instanceof TypeScript.Finally) this.emitFinally(<TypeScript.Finally>ast);
                else if (ast instanceof TypeScript.ForInStatement) this.emitForInStatement(<TypeScript.ForInStatement>ast);
                else if (ast instanceof TypeScript.ForStatement) this.emitForStatement(<TypeScript.ForStatement>ast);
                else if (ast instanceof TypeScript.Script) this.emitScript(<TypeScript.Script>ast);
                else if (ast instanceof TypeScript.FuncDecl) this.emitFuncDecl(<TypeScript.FuncDecl>ast);
                else if (ast instanceof TypeScript.Identifier) this.emitIdentifier(<TypeScript.Identifier>ast);
                else if (ast instanceof TypeScript.IfStatement) this.emitIfStatement(<TypeScript.IfStatement>ast);
                else if (ast instanceof TypeScript.ImportDeclaration) this.emitImportDeclaration(<TypeScript.ImportDeclaration>ast);
                else if (ast instanceof TypeScript.InterfaceDeclaration) this.emitInterfaceDeclaration(<TypeScript.InterfaceDeclaration>ast);
                else if (ast instanceof TypeScript.Jump) this.emitJump(<TypeScript.Jump>ast);
                else if (ast instanceof TypeScript.Label) this.emitLabel(<TypeScript.Label>ast);
                else if (ast instanceof TypeScript.LabeledStatement) this.emitLabeledStatement(<TypeScript.LabeledStatement>ast);
                else if (ast instanceof TypeScript.ModuleDeclaration) this.emitModuleDeclaration(<TypeScript.ModuleDeclaration>ast);
                else if (ast instanceof TypeScript.NumberLiteral) this.emitNumberLiteral(<TypeScript.NumberLiteral>ast);
                else if (ast instanceof TypeScript.RegexLiteral) this.emitRegexLiteral(<TypeScript.RegexLiteral>ast);
                else if (ast instanceof TypeScript.ReturnStatement) this.emitReturnStatement(<TypeScript.ReturnStatement>ast);
                else if (ast instanceof TypeScript.StringLiteral) this.emitStringLiteral(<TypeScript.StringLiteral>ast);
                else if (ast instanceof TypeScript.SwitchStatement) this.emitSwitchStatement(<TypeScript.SwitchStatement>ast);
                else if (ast instanceof TypeScript.Try) this.emitTry(<TypeScript.Try>ast);
                else if (ast instanceof TypeScript.TryCatch) this.emitTryCatch(<TypeScript.TryCatch>ast);
                else if (ast instanceof TypeScript.TryFinally) this.emitTryFinally(<TypeScript.TryFinally>ast);
                else if (ast instanceof TypeScript.UnaryExpression) this.emitUnaryExpression(<TypeScript.UnaryExpression>ast);
                else if (ast instanceof TypeScript.VarDecl) this.emitVarDecl(<TypeScript.VarDecl>ast);
                else if (ast instanceof TypeScript.WhileStatement) this.emitWhileStatement(<TypeScript.WhileStatement>ast);
                else switch (ast.nodeType) {
                    case TypeScript.NodeType.Empty: break;
                    case TypeScript.NodeType.EmptyExpr: break;
                    case TypeScript.NodeType.Error: break;
                    case TypeScript.NodeType.False:
                        this.write('false');
                        break;
                    case TypeScript.NodeType.Null:
                        this.write('null');
                        break;
                    case TypeScript.NodeType.This:
                        this.write('$this');
                        break;
                    case TypeScript.NodeType.True:
                        this.write('true');
                        break;
                    case TypeScript.NodeType.Super:
                        this.write('parent');
                        break;
                    case TypeScript.NodeType.Void:
                        this.write('null');
                        break;
                    default: throw new Error('Unrecognized ast - ' + ast.printLabel());
                }
                if (ast.isParenthesized) this.write(')');
            }
            this.stack.pop();
            return this;
        }

        extensionHandled(ast: TypeScript.AST): bool {
            if (typeof PhpEmitter.extensionsByNodeType[ast.nodeType] !== 'undefined') {
                return PhpEmitter.extensionsByNodeType[ast.nodeType].some((value: EmitterExtension) => {
                    if (this.matches(ast, value.matcher) && value.emit(ast, this)) return true;
                });
            } else return false;
        }

        matches(ast: TypeScript.AST, matcher: AstMatcher): bool {
            if (matcher.nodeType.indexOf(ast.nodeType) == -1) return false;
            if (typeof matcher.propertyMatches !== 'undefined') {
                for (var prop in matcher.propertyMatches) {
                    if (!(prop in ast)) return false;
                    var astProp = ast[prop];
                    var matcherProp = matcher.propertyMatches[prop];
                    if (typeof matcherProp === 'function') {
                        if (!matcherProp(astProp)) return false;
                    }
                }
            }
            return true;
        }

        emitCommaSeparated(ast: TypeScript.ASTList) {
            ast.members.forEach((member: TypeScript.AST, index: number) => {
                if (index > 0) this.write(', ');
                this.emit(member);
            });
            return this;
        }

        //specific emitters

        emitArgDecl(ast: TypeScript.ArgDecl) {
            //do we have a type hint?
            if (this.options.typeHint && ast.type != null) {
                if (ast.type.isArray()) this.write('array ');
                else if (ast.type.getTypeName() == 'PhpAssocArray') {
                    this.write('array ');
                } else if (ast.type.symbol.declAST != null &&
                        ast.type.symbol.declAST.nodeType == TypeScript.NodeType.FuncDecl) {
                    this.write('callable ');
                } else if (ast.type.symbol.declAST instanceof TypeScript.TypeDeclaration &&
                        !('compileTimeOnly' in ast.type.symbol.declAST)) {
                    this.write(ast.type.getTypeName() + ' ');
                }
            }
            this.emit(ast.id);
            //optional?
            if (ast.isOptionalArg()) {
                this.write(' = ');
                //scalar?
                if (this.isScalar(ast.init)) this.emit(ast.init);
                else this.write('null');
            }
        }

        emitBinaryExpression(ast: TypeScript.BinaryExpression) {
            //"in" becomes array_key_exists
            if (ast.nodeType == TypeScript.NodeType.In) {
                this.emit(new TypeScript.CallExpression(TypeScript.NodeType.Call, 
                    new TypeScript.Identifier('array_key_exists'),
                    (new TypeScript.ASTList()).append(ast.operand1).append(ast.operand2)));
            } else {
                var tokenInfo = this.getTokenInfo(ast);
                if (tokenInfo != null) {
                    this.emit(ast.operand1);
                    //string concat is different in PHP
                    var isAdd = tokenInfo.binopNodeType == TypeScript.NodeType.Add;
                    var isStringConcat = isAdd && (
                        (ast.operand1.type != null && ast.operand1.type.isString()) ||
                        (ast.operand2.type != null && ast.operand2.type.isString()));
                    if (isStringConcat) this.write(' . ');
                    else {
                        //warning, unknown type means we might have missed a string concat
                        if (isAdd && (ast.operand1.type == null || ast.operand1.type.getTypeName() == 'any')) {
                            this.addWarning(ast.operand1, 'Unknown type for addition, assuming arithmetic');
                        } else if (isAdd && (ast.operand2.type == null || ast.operand2.type.getTypeName() == 'any')) {
                            this.addWarning(ast.operand2, 'Unknown type for addition, assuming arithmetic');
                        }
                        this.write(' ' + tokenInfo.text + ' ');
                    }
                    this.emit(ast.operand2);
                } else switch (ast.nodeType) {
                    case TypeScript.NodeType.Dot:
                        this.emit(ast.operand1).write('->').emit(ast.operand2);
                        break;
                    case TypeScript.NodeType.Member:
                        if (ast.operand1 instanceof TypeScript.Identifier) {
                            //must be a string literal in PHP
                            this.emit(new TypeScript.StringLiteral('"' + (<TypeScript.Identifier>ast.operand1).actualText + '"'));
                        } else {
                            this.emit(ast.operand1);
                        }
                        this.write(' => ').emit(ast.operand2);
                        break;
                    case TypeScript.NodeType.Index:
                        var isIndex = ast.operand1.type.isArray() ||
                            this.typeHasNonObjectIndexFuncDecl(ast.operand1.type);
                        if (isIndex) {
                            this.emit(ast.operand1).write('[').emit(ast.operand2).write(']');
                        } else {
                            this.emit(ast.operand1).write('->{').emit(ast.operand2).write('}');
                        }
                        break;
                    default:
                        throw new Error('Unrecognized binary expression - ' + ast.printLabel());
                }
            }
        }

        emitBlock(ast: TypeScript.Block) {
            var prevLength = this.currStr.length;
            var newlines = !this.isAllOnOneLine(ast);
            this.write('{');
            if (newlines) this.increaseIndent();
            if (!this.emitBlockStatements(ast.statements, newlines)) {
                //rollback
                this.currStr = this.currStr.substr(0, prevLength);
            } else {
                if (newlines) this.decreaseIndent().newline();
                else this.write(' ');
                this.write('}');
            }
        }

        emitBlockStatements(statements: TypeScript.ASTList, newlines: bool): bool {
            var atLeastOneSuccessOrEmpty = statements == null || statements.members.length == 0;
            statements.members.forEach((statement: TypeScript.AST, index: number) => {
                var prevLength = this.currStr.length;
                //pre comments
                if (this.options.comments && statement.preComments != null && statement.preComments.length > 0) {
                    statement.preComments.forEach((value: TypeScript.Comment) => {
                        this.newline();
                        this.emit(value);
                    });
                }
                //ignore empty
                if (!this.isEmpty(statement)) {
                    if (newlines) this.newline();
                    else this.write(' ');
                    this.emit(statement);
                    //rollback on ambient
                    var isRollback = statement instanceof TypeScript.TypeDeclaration &&
                            (<TypeScript.TypeDeclaration>statement).isAmbient();
                    //also on empty var decl
                    isRollback = isRollback || (statement instanceof TypeScript.VarDecl &&
                        (<TypeScript.VarDecl>statement).init == null);
                    //also on ambient func decl
                    isRollback = isRollback || (statement instanceof TypeScript.FuncDecl &&
                        ((<TypeScript.FuncDecl>statement).isOverload || 
                        (<TypeScript.FuncDecl>statement).isAmbient()));
                    if (isRollback) {
                        this.currStr = this.currStr.substr(0, prevLength);
                        return;
                    }
                    atLeastOneSuccessOrEmpty = true;
                    this.semicolon(statement);
                    //extra newlines for decls
                    var hasExtraNewline = statement instanceof TypeScript.FuncDecl ||
                        statement instanceof TypeScript.NamedDeclaration;
                    if (newlines && hasExtraNewline) this.newline(false);
                }
                //post comments
                if (this.options.comments && statement.postComments != null && statement.postComments.length > 0) {
                    statement.postComments.forEach((value: TypeScript.Comment) => {
                        this.emit(value);
                    });
                }
            });
            return atLeastOneSuccessOrEmpty;
        }

        emitCallExpression(ast: TypeScript.CallExpression) {
            if (ast.nodeType == TypeScript.NodeType.New) {
                if (ast.target.nodeType == TypeScript.NodeType.TypeRef) {
                    this.write('[]');
                } else {
                    this.write('new ').emit(ast.target).write('(').emitCommaSeparated(ast.arguments).write(')');
                }
            } else {
                this.emit(ast.target).write('(').emitCommaSeparated(ast.arguments).write(')');
            }
        }

        emitCatch(ast: TypeScript.Catch) {
            this.write(' catch (Exception $' + ast.param.id.actualText + ') ').emit(ast.body);
        }

        emitCaseStatement(ast: TypeScript.CaseStatement) {
            if (ast.expr == null) this.write('default:');
            else this.write('case ').emit(ast.expr).write(':');
            if (ast.body != null && ast.body.members.length > 0) {
                //newlines?
                if (this.isAllOnOneLine(ast) && ast.body.members.length == 1) {
                    this.write(' ').emit(ast.body.members[0]).semicolon(ast.body.members[0]);
                } else {
                    this.increaseIndent().emitBlockStatements(ast.body, true);
                    this.decreaseIndent();
                }
            }
        }

        emitClassDeclaration(ast: TypeScript.ClassDeclaration) {
            if (ast.isAmbient()) return;
            this.write('class ').emit(ast.name);
            //can only have one extends
            if (ast.extendsList != null && ast.extendsList.members.length > 1) throw new Error('Multiple extends');
            if (ast.extendsList != null && ast.extendsList.members.length > 0) {
                //don't handle compile time only extends
                if (ast.extendsList.members[0].type == null ||
                        !('compileTimeOnly' in ast.extendsList.members[0].type.symbol.declAST)) {
                    this.write(' extends ').emit(ast.extendsList.members[0]);
                }
            }
            if (ast.implementsList != null && ast.implementsList.members.length > 0) {
                //don't handle compile time only implements
                var first = true;
                ast.implementsList.members.forEach((value: TypeScript.AST) => {
                    if (value.type == null || !('compileTimeOnly' in value.type.symbol.declAST)) {
                        if (!first) this.write(', ');
                        else {
                            first = false;
                            this.write(' implements ');
                        }
                        this.emit(value);
                    }
                });
            }
            this.write(' {').increaseIndent();
            //construct
            if (ast.constructorDecl != null) this.newline().emit(ast.constructorDecl).newline();
            //members
            if (ast.members != null) {
                ast.members.members.forEach((member: TypeScript.AST) => {
                    this.newline().emit(member).newline();
                });
            }
            this.decreaseIndent().newline().write('}');
        }

        emitComment(ast: TypeScript.Comment) {
            ast.content.split('\n').forEach((value: string, index: number) => {
                if (index > 0) this.newline();
                //take off only multiples of indent and/or tabs
                while (true) {
                    if (value.indexOf('\t') == 0) value = value.substr(1);
                    else if (value.indexOf(this.options.indent) == 0) value = value.substr(this.options.indent.length);
                    else break;
                }
                //add space if last wasn't newline/space/tab and first of value isn't
                if (value.length > 0 && this.currStr.length > 0) {
                    var lastChar = this.currStr.charAt(this.currStr.length - 1);
                    var firstChar = value.charAt(value.length - 1);
                    if (lastChar != '\n' && lastChar != ' ' && lastChar != '\t' &&
                        firstChar != '\n' && firstChar != ' ' && firstChar != '\t') this.write(' ');
                }
                this.write(value);
            });
        }

        emitConditionalExpression(ast: TypeScript.ConditionalExpression) {
            this.emit(ast.operand1).write(' ? ').emit(ast.operand2).write(' : ').emit(ast.operand3);
        }

        emitDoWhileStatement(ast: TypeScript.DoWhileStatement) {
            this.write('do ').emit(ast.body).semicolon(ast.body).write(' while (').emit(ast.cond).
                write(')').semicolon(null);
        }

        emitFinally(ast: TypeScript.Finally) {
            this.write(' finally ').emit(ast.body);
        }

        emitForInStatement(ast: TypeScript.ForInStatement) {
            this.write('foreach (array_keys(').emit(ast.obj).write(') as ');
            if (ast.lval instanceof TypeScript.VarDecl) this.emit((<TypeScript.VarDecl>ast.lval).id);
            else this.emit(ast.lval);
            this.write(') ').emit(ast.body).semicolon(ast.body);
        }

        emitForStatement(ast: TypeScript.ForStatement) {
            this.write('for (');
            if (ast.init != null) this.emit(ast.init);
            this.write('; ');
            if (ast.cond != null) this.emit(ast.cond);
            this.write('; ');
            if (ast.incr != null) this.emit(ast.incr);
            this.write(') ').emit(ast.body).semicolon(ast.body);
        }

        emitFuncDecl(ast: TypeScript.FuncDecl) {
            //ignore overloads and ambients
            if (ast.isOverload || ast.isAmbient()) return;
            //accessors disallowed
            if (ast.isAccessor()) throw new Error('Accessors not allowed');
            //actually a closure since it's nested?
            if (ast.enclosingFnc != null && !ast.isAnonymousFn()) {
                //it's an error if we have any variable of the same name
                if (ast.enclosingFnc.vars != null && ast.enclosingFnc.vars.members.some((value: TypeScript.AST) => {
                    return value instanceof TypeScript.VarDecl &&
                        (<TypeScript.Identifier>(<TypeScript.VarDecl>value).id).actualText == ast.name.actualText;
                })) {
                    this.addError(ast.name, 'Cannot have variable and nested function with the same name in function');
                    return;
                }
                this.write('$' + ast.name.actualText + ' = ');
            }
            //visibility
            if (ast.isPublic()) this.write('public ');
            else if (ast.isPrivate()) this.write('private ');
            //static?
            if (ast.isStatic()) this.write('static ');
            this.write('function ');
            //we don't do newlines if they didn't
            var newlines = !this.isAllOnOneLine(ast);
            //closure?
            if (ast.isAnonymousFn() || ast.enclosingFnc != null) this.write('(');
            else if (ast.isConstructor) this.write('__construct(');
            else this.emit(ast.name).write('(');
            //must make sure we ignore rest params
            var first = true;
            ast.arguments.members.forEach((value: TypeScript.ArgDecl, index: number) => {
                //write?
                if (!ast.variableArgList || index != ast.arguments.members.length - 1) {
                    if (first) first = false;
                    else this.write(', ');
                    this.emit(value);
                }
            });
            this.write(')');
            //sig?
            if (ast.isSignature()) this.write(';');
            else {
                this.write(' {');
                if (newlines) this.increaseIndent();
                //need to assign arguments?
                ast.freeVariables.some((value: TypeScript.Symbol) => {
                    if (value.name == 'arguments' && value.declAST == null) {
                        if (newlines) this.newline();
                        else this.write(' ');
                        this.write('$arguments = func_get_args();');
                        return true;
                    }
                    return false;
                });
                //optional inits?
                ast.arguments.members.forEach((value: TypeScript.ArgDecl, index: number) => {
                    //write?
                    if (value.isOptionalArg() && (!ast.variableArgList || index != ast.arguments.members.length - 1) && 
                            value.init != null && !this.isScalar(value.init)) {
                        if (newlines) this.newline();
                        else this.write(' ');
                        this.write('if (').emit(value.id).write(' === null) ').
                            emit(value.id).write(' = ').emit(value.init).write(';');
                    }
                });
                //variadic?
                if (ast.variableArgList) {
                    //grab last arg
                    var lastArg = ast.arguments.members[ast.arguments.members.length - 1];
                    if (newlines) this.newline();
                    else this.write(' ');
                    //set just to func_get_args if only arg
                    if (ast.arguments.members.length == 1) {
                        this.emit((<TypeScript.ArgDecl>lastArg).id).write(' = func_get_args();');
                    } else {
                        //slice
                        this.emit((<TypeScript.ArgDecl>lastArg).id).write(' = array_slice(func_get_args(), ' +
                            (ast.arguments.members.length - 1) + ');');
                    }
                }
                this.emitBlockStatements(ast.bod, newlines);
                if (newlines) this.decreaseIndent().newline();
                else this.write(' ');
                this.write('}');
            }
        }

        emitIdentifier(ast: TypeScript.Identifier) {
            //must be variable for $
            var hasDollar = ast.sym != null && ast.sym.isVariable() && (ast.sym.container != null || 
                    ast.sym.name == 'arguments') && !TypeScript.hasFlag(ast.sym.flags, TypeScript.SymbolFlags.Constant);
            //can't be all caps with setting set
            if (hasDollar && this.options.allCapsConsts && ast.actualText.toUpperCase() != ast.actualText) {
                hasDollar = false;
            }
            //nested functions which we make anon are ok to have dollar signs
            if (!hasDollar && ast.type != null && ast.type.symbol.declAST != null &&
                    ast.type.symbol.declAST instanceof TypeScript.FuncDecl &&
                    (<TypeScript.FuncDecl>ast.type.symbol.declAST).enclosingFnc != null) {
                hasDollar = true;
            }
            if (hasDollar) this.write('$');
            this.write(ast.actualText);
        }

        emitIfStatement(ast: TypeScript.IfStatement) {
            this.write('if (').emit(ast.cond).write(') ').emit(ast.thenBod).semicolon(ast.thenBod);
            if (ast.elseBod != null) {
                //do we need a newline?
                if (this.getEndLine(ast.thenBod).line != this.getStartLine(ast.elseBod).line) {
                    this.newline();
                } else this.write(' ');
                this.write('else');
                if (!(ast.elseBod instanceof TypeScript.IfStatement) || !this.options.useElseif) {
                    this.write(' ');
                }
                this.emit(ast.elseBod).semicolon(ast.elseBod);
            }
        }

        emitImportDeclaration(ast: TypeScript.ImportDeclaration) {
            //TODO
        }

        emitInterfaceDeclaration(ast: TypeScript.InterfaceDeclaration) {
            //ignore ambient
            if (ast.isAmbient()) return;
            this.write('interface ').emit(ast.name);
            if (ast.extendsList != null && ast.extendsList.members.length > 0) {
                //don't handle compile time only extends
                var first = true;
                ast.extendsList.members.forEach((value: TypeScript.AST) => {
                    if (value.type == null || !('compileTimeOnly' in value.type.symbol.declAST)) {
                        if (!first) this.write(', ');
                        else {
                            first = false;
                            this.write(' extends ');
                        }
                        this.emit(value);
                    }
                });
            }
            this.write(' {').increaseIndent();
            //members
            if (ast.members != null) {
                ast.members.members.forEach((member: TypeScript.AST) => {
                    this.newline().emit(member).newline();
                });
            }
            this.decreaseIndent().newline().write('}');
        }

        emitJump(ast: TypeScript.Jump) {
            //becomes goto
            if (ast.hasExplicitTarget()) this.write('goto ' + ast.target);
            else if (ast.nodeType == TypeScript.NodeType.Break) this.write('break');
            else this.write('continue');
        }

        emitLabel(ast: TypeScript.Label) {
            this.emit(ast.id).write(':');
        }

        emitLabeledStatement(ast: TypeScript.LabeledStatement) {
            if (ast.labels != null) {
                ast.labels.members.forEach((label: TypeScript.AST)  => {
                    this.emit(label).newline();
                });
            }
            this.emit(ast.stmt);
        }

        emitModuleDeclaration(ast: TypeScript.ModuleDeclaration) {
            this.write('namespace ' + ast.name.actualText.replace(/\./g, '\\'));
            this.write(' {').newline().increaseIndent();
            this.emitBlockStatements(ast.members, true);
            this.decreaseIndent().newline().write('}');
        }

        emitNumberLiteral(ast: TypeScript.NumberLiteral) {
            this.write(ast.value.toString());
            if (ast.hasEmptyFraction) this.write('.0');
        }

        emitRegexLiteral(ast: TypeScript.RegexLiteral) {
            this.addError(ast, 'Regex is unsupported');
        }

        emitReturnStatement(ast: TypeScript.ReturnStatement) {
            if (ast.returnExpression == null) this.write('return');
            else this.write('return ').emit(ast.returnExpression);
        }

        emitScript(ast: TypeScript.Script) {
            this.emitBlockStatements(ast.bod, true);
        }

        emitStringLiteral(ast: TypeScript.StringLiteral) {
            //is there a slash?
            var isSlash = ast.text.indexOf('\\') != -1;
            var isSingleQuote = !isSlash && (this.options.alwaysPreferSingleQuotes || ast.text.charAt(0) == "'");
            if (isSingleQuote) {
                this.write("'").write(ast.text.substr(1, ast.text.length - 2)).write("'");
            } else {
                //must escape $ (which becomes \$ so {\$ is also handled)
                this.write('"').write(ast.text.substr(1, ast.text.length - 2).replace(/\$/g, '\\$')).write('"');
            }
        }

        emitSwitchStatement(ast: TypeScript.SwitchStatement) {
            this.write('switch (').emit(ast.val).write(') {').increaseIndent();
            ast.caseList.members.forEach((member: TypeScript.AST) => {
                this.newline().emit(member);
            });
            this.decreaseIndent().newline().write('}');
        }

        emitTry(ast: TypeScript.Try) {
            this.write('try ').emit(ast.body);
        }

        emitTryCatch(ast: TypeScript.TryCatch) {
            this.emit(ast.tryNode).emit(ast.catchNode);
        }

        emitTryFinally(ast: TypeScript.TryFinally) {
            this.emit(ast.tryNode).emit(ast.finallyNode);
        }

        emitUnaryExpression(ast: TypeScript.UnaryExpression, ignorePossibleObjectCast = false) {
            switch (ast.nodeType) {
                case TypeScript.NodeType.IncPost:
                    this.emit(ast.operand).write('++');
                    break;
                case TypeScript.NodeType.LogNot:
                    this.write('!').emit(ast.operand);
                    break;
                case TypeScript.NodeType.DecPost:
                    this.emit(ast.operand).write('--');
                    break;
                case TypeScript.NodeType.ObjectLit:
                case TypeScript.NodeType.ArrayLit:
                    //we newline-style if they did
                    var newlineStyle = !this.isAllOnOneLine(ast);
                    if (ast.nodeType == TypeScript.NodeType.ObjectLit && !ignorePossibleObjectCast) this.write('(object)');
                    this.write('[');
                    if (newlineStyle) this.increaseIndent().newline();
                    var first = true;
                    (<TypeScript.ASTList>ast.operand).members.forEach((value: TypeScript.AST) => {
                        if (first) first = false;
                        else {
                            this.write(',');
                            if (newlineStyle) this.newline();
                            else this.write(' ');
                        }
                        this.emit(value);
                    });
                    if (newlineStyle) this.decreaseIndent().newline();
                    this.write(']');
                    break;
                case TypeScript.NodeType.Not:
                    this.write('~').emit(ast.operand);
                    break;
                case TypeScript.NodeType.Neg:
                    this.write('-').emit(ast.operand);
                    break;
                case TypeScript.NodeType.Pos:
                    this.write('+').emit(ast.operand);
                    break;
                case TypeScript.NodeType.IncPre:
                    this.write('++').emit(ast.operand);
                    break;
                case TypeScript.NodeType.DecPre:
                    this.write('--').emit(ast.operand);
                    break;
                case TypeScript.NodeType.Throw:
                    this.write('throw ').emit(ast.operand);
                    break;
                case TypeScript.NodeType.Typeof:
                    this.write('gettype(').emit(ast.operand).write(')');
                    break;
                case TypeScript.NodeType.Delete:
                    this.write('unset(').emit(ast.operand).write(')');
                    break;
                case TypeScript.NodeType.TypeAssertion:
                    this.emit(ast.operand);
                    break;
                case TypeScript.NodeType.Void:
                    throw new Error('Void unsupported');
                default:
                    throw new Error('Unrecognized type - ' + ast.printLabel());
            }
        }

        emitVarDecl(ast: TypeScript.VarDecl) {
            //no init, no emit
            if (ast.init != null) {
                this.emit(ast.id);
                if (ast.init != null) {
                    this.write(' = ').emit(ast.init);
                }
            }
        }

        emitWhileStatement(ast: TypeScript.WhileStatement) {
            this.write('while (').emit(ast.cond).write(') ').emit(ast.body).semicolon(ast.body);
        }

        isAllOnOneLine(ast: TypeScript.AST) {
            return this.getStartLine(ast).line == this.getEndLine(ast).line;
        }

        getStartLine(ast: TypeScript.AST) {
            var lineCol = { line: -1, col: -1 };
            TypeScript.getSourceLineColFromMap(lineCol, ast.minChar, this.checker.locationInfo.lineMap);
            return lineCol;
        }

        getEndLine(ast: TypeScript.AST) {
            var lineCol = { line: -1, col: -1 };
            TypeScript.getSourceLineColFromMap(lineCol, ast.limChar, this.checker.locationInfo.lineMap);
            return lineCol;
        }

        getTokenInfo(ast: TypeScript.AST) {
            var num = TypeScript.nodeTypeToTokTable[ast.nodeType];
            if (num == undefined) return null;
            return TypeScript.tokenTable[num];
        }

        getParent() {
            if (this.stack.length <= 2) return null;
            return this.stack[this.stack.length - 2];
        }

        isEmpty(ast: TypeScript.AST) {
            return ast.nodeType == TypeScript.NodeType.Empty ||
                ast.nodeType == TypeScript.NodeType.EmptyExpr ||
                ast.nodeType == TypeScript.NodeType.EndCode;
        }

        isScalar(ast: TypeScript.AST) {
            if (ast == null) return false;
            if (ast.nodeType == TypeScript.NodeType.NumberLit ||
                ast.nodeType == TypeScript.NodeType.QString ||
                ast.nodeType == TypeScript.NodeType.True ||
                ast.nodeType == TypeScript.NodeType.False) return true;
            if (ast.nodeType != TypeScript.NodeType.ArrayLit) return false;
            return (<TypeScript.ASTList>(<TypeScript.UnaryExpression>ast).operand).members.every(this.isScalar, this);
        }

        addError(ast: TypeScript.AST, message: string) {
            var start = this.getStartLine(ast);
            this.errors.push(new EmitterError(message, start.line, start.col));
        }

        addWarning(ast: TypeScript.AST, message: string) {
            var start = this.getStartLine(ast);
            this.warnings.push(new EmitterError(message, start.line, start.col));
        }

        newTempVarName() {
            return '_tmp' + (++this.tempVarCounter);
        }

        hasSemicolonAfterStatement(ast: TypeScript.AST) {
            //these handle their own semi colons
            return !(ast instanceof TypeScript.Block) &&
                !(ast instanceof TypeScript.DoWhileStatement) &&
                !(ast instanceof TypeScript.ForStatement) &&
                !(ast instanceof TypeScript.ForInStatement) &&
                (!(ast instanceof TypeScript.FuncDecl) ||
                    (<TypeScript.FuncDecl>ast).enclosingFnc != null ||
                    (<TypeScript.FuncDecl>ast).isAnonymousFn()) &&
                !(ast instanceof TypeScript.IfStatement) &&
                (!(ast instanceof TypeScript.LabeledStatement) ||
                    this.hasSemicolonAfterStatement((<TypeScript.LabeledStatement>ast).stmt)) &&
                !(ast instanceof TypeScript.NamedDeclaration) &&
                !(ast instanceof TypeScript.SwitchStatement) &&
                !(ast instanceof TypeScript.Try) &&
                !(ast instanceof TypeScript.TryCatch) &&
                !(ast instanceof TypeScript.TryFinally) &&
                !(ast instanceof TypeScript.WhileStatement);
        }

        typeHasNonObjectIndexFuncDecl(type: TypeScript.Type, checkedIds: number[] = []) {
            if (checkedIds.indexOf(type.typeID) > -1) return false;
            if (type.getTypeName() == 'Object') return false;
            checkedIds.push(type.typeID);
            //check my members
            if (type.symbol.declAST instanceof TypeScript.TypeDeclaration &&
                    (<TypeScript.TypeDeclaration>type.symbol.declAST).members != null) {
                if ((<TypeScript.TypeDeclaration>type.symbol.declAST).members.members.some((value: TypeScript.AST) => {
                    return value instanceof TypeScript.FuncDecl &&
                        TypeScript.hasFlag((<TypeScript.FuncDecl>value).fncFlags, TypeScript.FncFlags.IndexerMember);
                })) return true;
            }
            //check extends and implements
            if (type.implementsList != null) {
                if (type.implementsList.some((value: TypeScript.Type) => {
                    return this.typeHasNonObjectIndexFuncDecl(value, checkedIds);
                })) return true;
            }
            if (type.extendsList != null) {
                if (type.extendsList.some((value: TypeScript.Type) => {
                    return this.typeHasNonObjectIndexFuncDecl(value, checkedIds);
                })) return true;
            }
            return false;
        }
    }
}
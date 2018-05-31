import * as ts from 'typescript';

export function injectPerfMarkers(input: string): string {
  const sourceFile = ts.createSourceFile(
    'usercode',
    input,
    ts.ScriptTarget.ES2015,
    true /*setParentNodes */
  );

  injectPerfRecursive(sourceFile);

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });

  return printer.printNode(ts.EmitHint.Unspecified, sourceFile, null);

  // Helper
  function injectPerfRecursive(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ExpressionStatement:
      case ts.SyntaxKind.PropertyAssignment:
      case ts.SyntaxKind.ShorthandPropertyAssignment:
      case ts.SyntaxKind.VariableStatement:
        if (node.parent && node.parent.kind === ts.SyntaxKind.Block) {
          let parent = node.parent as ts.Block;
          let statements = parent.statements;
          const node_index = statements.indexOf(node as ts.Statement);
          const node_line_no =
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          parent.statements = ts.createNodeArray([
            ...statements.slice(0, node_index),
            getExpressionPrefix(node_line_no),
            statements[node_index],
            getExpressionSuffix(node_line_no),
            ...statements.slice(node_index + 1, statements.length),
          ]);
        }
    }

    ts.forEachChild(node, injectPerfRecursive);
  }
}

function getExpressionPrefix(something: number): ts.Statement {
  const funcName = ts.createIdentifier('start_perf_timer');
  const func = ts.createCall(funcName, undefined, [ts.createLiteral(something)]);
  return ts.createStatement(func);
}

function getExpressionSuffix(something: number): ts.Statement {
  const funcName = ts.createIdentifier('stop_perf_timer');
  const func = ts.createCall(funcName, undefined, [ts.createLiteral(something)]);
  return ts.createStatement(func);
}

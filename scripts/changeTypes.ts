import { SourceFile, VariableDeclaration, SyntaxKind, Node } from "ts-morph";

export const changeTypes = (source: SourceFile): void => {
    addAnyTypeToConsts(source);


  source.forEachDescendant((node) => {
    // console.log(node.getType());
    // Nos interesan solo declaraciones de variables (const) con tipo explícito
    if (
      node.getKind() === SyntaxKind.VariableDeclaration &&
      node.getParentOrThrow().getParentOrThrow().getKind() === SyntaxKind.VariableStatement
    ) {
      const varDecl = node as VariableDeclaration;
      const varStmt = varDecl.getVariableStatement();

      const a: String = 'a';

    //   console.log(varStmt?.getDeclarationKind());

      // Solo procesar const
      if (varStmt?.getDeclarationKind() !== "const") return;

      const typeNode = varDecl.getTypeNode();
      const initializer = varDecl.getInitializer();

      if (typeNode) {
        // console.log("typeNode", typeNode?.getText(), "initializer", initializer?.getText());
      }

      if (typeNode && initializer) {
        // Quitar el tipo
        // typeNode.remove();

        // Reemplazar la expresión original con una versión casteada
        const originalText = initializer.getText();
        initializer.replaceWithText(`(${originalText}) as unknown as any`);
      }
    }
  });

  transformForEachDescendantAndConditions(source);
  castLiteralsAndReturns(source);
};


export const addAnyTypeToConsts = (source: SourceFile): void => {
  source.forEachDescendant((node) => {
    if (
      node.getKind() === SyntaxKind.VariableDeclaration &&
      node.getParentOrThrow().getParentOrThrow().getKind() === SyntaxKind.VariableStatement
    ) {
      const varDecl = node as VariableDeclaration;
      const varStmt = varDecl.getVariableStatement();

      // Solo const
      if (varStmt?.getDeclarationKind() !== "const") return;

      // Ya tiene tipo explícito → reemplazar
      if (varDecl.getTypeNode()) {
        varDecl.removeType();
      }

      // Añadir ": any"
      varDecl.setType("any");
    }
  });
};

export const transformForEachDescendantAndConditions = (source: SourceFile): void => {
  // 1. Añadir ": any" al parámetro del forEachDescendant
  source.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
    const expression = callExpr.getExpression().getText();

    if (expression.endsWith("forEachDescendant")) {
      const arg = callExpr.getArguments()[0];
      if (arg && arg.getKind() === SyntaxKind.ArrowFunction) {
        const arrowFn = arg.asKindOrThrow(SyntaxKind.ArrowFunction);
        const param = arrowFn.getParameters()[0];

        if (param && !param.getTypeNode()) {
          param.setType("any");
        }
      }
    }
  });

  // 2. Reemplazar condiciones tipo "if (a && b)" por "if ((a as unknown as any) && (b as unknown as any))"
  source.getDescendantsOfKind(SyntaxKind.IfStatement).forEach((ifStmt) => {
    const condition = ifStmt.getExpression();

    if (condition.getKind() === SyntaxKind.BinaryExpression) {
      const binExpr = condition.asKindOrThrow(SyntaxKind.BinaryExpression);
      if (binExpr.getOperatorToken().getKind() === SyntaxKind.AmpersandAmpersandToken) {
        const left = binExpr.getLeft();
        const right = binExpr.getRight();

        left.replaceWithText(`(${left.getText()} as unknown as any)`);
        right.replaceWithText(`(${right.getText()} as unknown as any)`);
      }
    }
  });
};


export const castLiteralsAndReturns = (source: SourceFile): void => {
  const replacements: { node: Node; newText: string }[] = [];

  const isAlreadyScheduled = (node: Node) =>
    replacements.some(({ node: scheduledNode }) => scheduledNode === node || scheduledNode.containsRange(node.getStart(), node.getEnd()));

  // Recolectar cambios en objetos literales
  source.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression).forEach((obj) => {
    if (!isAlreadyScheduled(obj) && !obj.getText().includes("as unknown as any")) {
      replacements.push({ node: obj, newText: `(${obj.getText()}) as unknown as any` });
      return; // No sigas recorriendo propiedades si el objeto entero se va a reemplazar
    }

    obj.getProperties().forEach((prop) => {
      if (prop.getKind() === SyntaxKind.PropertyAssignment) {
        const assignment = prop.asKindOrThrow(SyntaxKind.PropertyAssignment);
        const initializer = assignment.getInitializer();
        if (!initializer || isAlreadyScheduled(initializer)) return;

        const kind = initializer.getKind();
        const text = initializer.getText();
        if (text.includes("as unknown as any")) return;

        if (
          kind === SyntaxKind.StringLiteral ||
          kind === SyntaxKind.NumericLiteral ||
          kind === SyntaxKind.TrueKeyword ||
          kind === SyntaxKind.FalseKeyword ||
          kind === SyntaxKind.ObjectLiteralExpression
        ) {
          replacements.push({ node: initializer, newText: `(${text}) as unknown as any` });
        }
      }
    });
  });

  // Envolver retornos
  source.getDescendantsOfKind(SyntaxKind.ReturnStatement).forEach((retStmt) => {
    const expr = retStmt.getExpression();
    if (!expr || isAlreadyScheduled(expr)) return;

    const text = expr.getText();
    if (!text.includes("as unknown as any")) {
      replacements.push({ node: expr, newText: `(${text}) as unknown as any` });
    }
  });

  // Aplicar reemplazos al final
  for (const { node, newText } of replacements) {
    node.replaceWithText(newText);
  }
};
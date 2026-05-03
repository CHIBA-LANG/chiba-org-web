export const chibaLanguage = {
  id: 'chiba',
  scopeName: 'source.chiba',
  aliases: ['cbi', 'chibalex', 'chibacc'],
  grammar: {
    name: 'chiba',
    scopeName: 'source.chiba',
    patterns: [
      { include: '#comments' },
      { include: '#strings' },
      { include: '#numbers' },
      { include: '#directives' },
      { include: '#keywords' },
      { include: '#grammarKeywords' },
      { include: '#declarations' },
      { include: '#types' },
      { include: '#atoms' },
      { include: '#attributes' },
      { include: '#grammarSymbols' },
      { include: '#lexerSymbols' },
      { include: '#functions' },
      { include: '#operators' },
    ],
    repository: {
      comments: {
        patterns: [
          {
            name: 'comment.line.double-slash.chiba',
            begin: '//',
            end: '$',
          },
        ],
      },
      strings: {
        patterns: [
          {
            name: 'string.quoted.other.raw.chiba',
            begin: '(?:\\b[a-zA-Z_][a-zA-Z0-9_]*|c)?r#{0,2}"',
            end: '"#{0,2}',
          },
          {
            name: 'string.quoted.double.chiba',
            begin: '(?:\\b[a-zA-Z_][a-zA-Z0-9_]*|c)?#{0,2}"',
            end: '"#{0,2}',
            patterns: [
              {
                name: 'constant.character.escape.chiba',
                match: '\\\\.',
              },
              {
                name: 'meta.interpolation.chiba',
                begin: '\\\${',
                end: '}',
              },
            ],
          },
        ],
      },
      numbers: {
        patterns: [
          {
            name: 'constant.numeric.chiba',
            match: '\\b(?:0[xX][0-9A-Fa-f_]+|0[bB][01_]+|0[oO][0-7_]+|\\d[\\d_]*(?:\\.\\d[\\d_]*)?)\\b',
          },
        ],
      },
      keywords: {
        patterns: [
          {
            name: 'keyword.control.chiba',
            match: '\\b(?:if|else|match|for|break|continue|return|reset|shift|unsafe|use|namespace)\\b',
          },
          {
            name: 'keyword.declaration.chiba',
            match: '\\b(?:def|let|type|data|union|extern|private)\\b',
          },
          {
            name: 'constant.language.chiba',
            match: '\\b(?:true|false)\\b',
          },
        ],
      },
      directives: {
        patterns: [
          {
            name: 'meta.preprocessor.chiba',
            match: '#!\\[(?:CHIBALEX|CHIBACC|Metal|CBI)\\]',
          },
        ],
      },
      grammarKeywords: {
        patterns: [
          {
            name: 'keyword.other.grammar.chiba',
            match: '\\b(?:start|rule|tokens)\\b',
          },
          {
            name: 'keyword.operator.predicate.chiba',
            match: '\\?[A-Za-z_][A-Za-z0-9_]*(?=\\s*\\()',
          },
        ],
      },
      declarations: {
        patterns: [
          {
            name: 'entity.name.function.chiba',
            match: '(?<=\\bdef\\s)(?:[A-Z][A-Za-z0-9_]*\\.)?[a-z_][A-Za-z0-9_]*',
          },
          {
            name: 'variable.other.definition.chiba',
            match: '(?<=\\blet\\s)[a-z_][A-Za-z0-9_]*',
          },
          {
            name: 'entity.name.type.chiba',
            match: '(?<=\\b(?:type|data|union)\\s)[A-Z][A-Za-z0-9_]*',
          },
          {
            name: 'entity.name.rule.chiba',
            match: '(?<=\\b(?:start|rule)\\s)[a-z_][A-Za-z0-9_]*',
          },
        ],
      },
      types: {
        patterns: [
          {
            name: 'support.type.builtin.chiba',
            match: '\\b(?:i8|i16|i32|i64|u8|u16|u32|u64|f32|f64|bool|unit|str|cstr|String|Ptr|Ref|UnsafeRef|usize)\\b',
          },
          {
            name: 'entity.name.type.chiba',
            match: '\\b[A-Z][A-Za-z0-9_]*\\b',
          },
        ],
      },
      atoms: {
        patterns: [
          {
            name: 'constant.other.atom.chiba',
            match: ':[A-Za-z_][A-Za-z0-9_]*',
          },
        ],
      },
      attributes: {
        patterns: [
          {
            name: 'storage.modifier.attribute.chiba',
            match: '#!?\\[[^\\]]+\\]',
          },
        ],
      },
      grammarSymbols: {
        patterns: [
          {
            name: 'keyword.operator.grammar.chiba',
            match: '::=|:-|=>|\\|',
          },
          {
            name: 'keyword.operator.quantifier.chiba',
            match: '[*+?](?![=])',
          },
          {
            name: 'variable.parameter.label.chiba',
            match: '\\b[a-z_][A-Za-z0-9_]*(?=:)',
          },
          {
            name: 'variable.language.special.chiba',
            match: '\\$(?:lhs|rhs|[0-9]+)\\b',
          },
        ],
      },
      lexerSymbols: {
        patterns: [
          {
            name: 'variable.other.charclass.chiba',
            match: '\\$[A-Za-z_][A-Za-z0-9_]*',
          },
          {
            name: 'entity.name.macro.chiba',
            match: '@[A-Za-z_][A-Za-z0-9_]*',
          },
          {
            name: 'constant.character.character-class.chiba',
            begin: '\\[(?:\\^)?',
            end: '\\]',
          },
        ],
      },
      functions: {
        patterns: [
          {
            name: 'entity.name.function.call.chiba',
            match: '\\b[a-z_][A-Za-z0-9_]*(?=\\s*\\()',
          },
        ],
      },
      operators: {
        patterns: [
          {
            name: 'keyword.operator.chiba',
            match: '\\|>|:=|==|!=|<=|>=|&&|\\|\\||=>|[+\\-*/%<>&|=!]',
          },
        ],
      },
    },
  },
};
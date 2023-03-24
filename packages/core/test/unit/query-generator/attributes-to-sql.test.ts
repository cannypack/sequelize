import { expectPerDialect, sequelize } from '../../support';

// TODO: overhaul this test suite when migrating attributesToSQL and attributeToSQL to TypeScript
/**
 * Make methods stricter, throw when using invalid options
 * Add tests for the various options for attributeToSQL
 * Properly check if attributesToSQL and attributeToSQL are typed correctly
 * Check if all tests make sense, the current tests are just copied from dialect specific tests and other expectations are added
 * Give tests better names
 * Make sure that all resulting objects are valid by adding integration tests for the QueryInterface functions where attributesToSQL is used
 */

describe('QueryGenerator#attributesToSQL', () => {
  const queryGenerator = sequelize.getQueryInterface().queryGenerator;

  // TODO: remove this functionality?
  it(`{ id: 'INTEGER' }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: 'INTEGER' }), {
      default: { id: 'INTEGER' },
      'mssql ibmi': new Error('attributeTypeToSql received a type that is neither a string or an instance of AbstractDataType'),
    });
  });

  // TODO: remove this functionality?
  it(`{ id: 'INTEGER', foo: 'VARCHAR(255)' }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: 'INTEGER', foo: 'VARCHAR(255)' }), {
      default: { id: 'INTEGER', foo: 'VARCHAR(255)' },
      'mssql ibmi': new Error('attributeTypeToSql received a type that is neither a string or an instance of AbstractDataType'),
    });
  });

  it(`{ id: { type: 'INTEGER' } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER' } }), {
      default: { id: 'INTEGER' },
      mssql: { id: 'INTEGER NULL' },
    });
  });

  it(`{ id: { type: 'INTEGER', allowNull: false } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', allowNull: false } }), {
      default: { id: 'INTEGER NOT NULL' },
    });
  });

  it(`{ id: { type: 'INTEGER', allowNull: true } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', allowNull: true } }), {
      default: { id: 'INTEGER' },
      mssql: { id: 'INTEGER NULL' },
    });
  });

  it(`{ id: { type: 'INTEGER', primaryKey: true, autoIncrement: true } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', primaryKey: true, autoIncrement: true } }), {
      default: { id: 'INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY(START WITH 1, INCREMENT BY 1) PRIMARY KEY' },
      'mariadb mysql': { id: 'INTEGER auto_increment PRIMARY KEY' },
      postgres: { id: 'INTEGER SERIAL PRIMARY KEY' },
      mssql: { id: 'INTEGER IDENTITY(1,1) PRIMARY KEY' },
      sqlite: { id: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      snowflake: { id: 'INTEGER AUTOINCREMENT PRIMARY KEY' },
      ibmi: { id: 'INTEGER GENERATED BY DEFAULT AS IDENTITY (START WITH 1, INCREMENT BY 1) PRIMARY KEY' },
    });
  });

  it(`{ id: { type: 'INTEGER', primaryKey: true, autoIncrement: true, autoIncrementIdentity: true } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', primaryKey: true, autoIncrement: true, autoIncrementIdentity: true } }), {
      default: { id: 'INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY(START WITH 1, INCREMENT BY 1) PRIMARY KEY' },
      'mariadb mysql': { id: 'INTEGER auto_increment PRIMARY KEY' },
      postgres: { id: 'INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY' },
      mssql: { id: 'INTEGER IDENTITY(1,1) PRIMARY KEY' },
      sqlite: { id: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      snowflake: { id: 'INTEGER AUTOINCREMENT PRIMARY KEY' },
      ibmi: { id: 'INTEGER GENERATED BY DEFAULT AS IDENTITY (START WITH 1, INCREMENT BY 1) PRIMARY KEY' },
    });
  });

  it(`{ id: { type: 'INTEGER', defaultValue: 0 } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', defaultValue: 0 } }), {
      default: { id: 'INTEGER DEFAULT 0' },
    });
  });

  it(`{ id: { type: 'INTEGER', defaultValue: undefined } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', defaultValue: undefined } }), {
      default: { id: 'INTEGER' },
      mssql: { id: 'INTEGER NULL' },
    });
  });

  it('Add column level comment', () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', comment: 'Test' } }), {
      default: { id: 'INTEGER COMMENT Test' },
      'mariadb mysql snowflake': { id: `INTEGER COMMENT 'Test'` },
      mssql: { id: 'INTEGER NULL COMMENT Test' },
      'sqlite ibmi': { id: 'INTEGER' },
    });
  });

  it(`{ id: { type: 'INTEGER', unique: true } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', unique: true } }), {
      default: { id: 'INTEGER UNIQUE' },
      mssql: { id: 'INTEGER NULL UNIQUE' },
    });
  });

  it(`{ id: { type: 'INTEGER', unique: true, comment: 'This is my comment' } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', unique: true, comment: 'This is my comment' } }), {
      default: { id: 'INTEGER UNIQUE COMMENT This is my comment' },
      'mariadb mysql snowflake': { id: `INTEGER UNIQUE COMMENT 'This is my comment'` },
      mssql: { id: 'INTEGER NULL UNIQUE COMMENT This is my comment' },
      'sqlite ibmi': { id: 'INTEGER UNIQUE' },
    });
  });

  it(`{ id: { type: 'INTEGER', unique: true, comment: 'This is my comment' } }, { context: 'addColumn', key: 'column', table: { schema: 'foo', tableName: 'bar' } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', unique: true, comment: 'This is my comment' } }, { context: 'addColumn', key: 'column', table: { schema: 'foo', tableName: 'bar' } }), {
      default: { id: 'INTEGER UNIQUE COMMENT This is my comment' },
      'mariadb mysql snowflake': { id: `INTEGER UNIQUE COMMENT 'This is my comment'` },
      postgres: { id: `INTEGER UNIQUE; COMMENT ON COLUMN "foo"."bar"."column" IS 'This is my comment'` },
      mssql: { id: 'INTEGER NULL UNIQUE COMMENT This is my comment' },
      'sqlite ibmi': { id: 'INTEGER UNIQUE' },
    });
  });

  it(`{ id: { type: 'INTEGER', after: 'Bar' } }`, () => {
    // @ts-expect-error -- after is not accepted in AttributeOptions so attributesToSQL might need to be typed differently
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', after: 'Bar' } }), {
      default: { id: 'INTEGER' },
      'mariadb mysql': { id: 'INTEGER AFTER `Bar`' },
      mssql: { id: 'INTEGER NULL' },
      'snowflake ibmi': { id: 'INTEGER AFTER "Bar"' },
    });
  });

  // TODO: check what this test is supposed to do and update the possible defaultValue accordingly
  it(`No empty array as default value for BLOB allowed for some dialects`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'BLOB', defaultValue: [] } }), {
      default: { id: 'BLOB' },
      'postgres sqlite mssql db2': new Error('Could not guess type of value [] because it is an empty array'),
    });
  });

  // TODO: this test is broken for at least DB2. It adds the default value because the data type is a string, which can't have special behaviors.
  //  change type to an actual Sequelize DataType & re-enable
  it(`No buffer from empty array as default value for BLOB allowed for some dialects`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'BLOB', defaultValue: Buffer.from([]) } }), {
      default: { id: 'BLOB' },
      postgres: { id: 'BLOB DEFAULT \'\\x\'' },
      mssql: { id: 'BLOB DEFAULT 0x' },
      sqlite: { id: 'BLOB DEFAULT X\'\'' },
      db2: { id: 'BLOB DEFAULT BLOB(\'\')' },
    });
  });

  // TODO: check what this test is supposed to do and update the possible defaultValue accordingly
  it(`No Default value for TEXT allowed for some dialects`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'TEXT', defaultValue: [] } }), {
      default: { id: 'TEXT' },
      'postgres sqlite ibmi': new Error('Could not guess type of value [] because it is an empty array'),
    });
  });

  // TODO: check what this test is supposed to do and update the possible defaultValue accordingly
  it(`No Default value for GEOMETRY allowed for some dialects`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'GEOMETRY', defaultValue: [] } }), {
      default: new Error('Could not guess type of value [] because it is an empty array'),
      'mariadb mysql snowflake': { id: 'GEOMETRY' },
    });
  });

  // TODO: check what this test is supposed to do and update the possible defaultValue accordingly
  it(`No Default value for JSON allowed for some dialects`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'JSON', defaultValue: [] } }), {
      default: new Error('Could not guess type of value [] because it is an empty array'),
      'mariadb mysql snowflake': { id: 'JSON' },
    });
  });

  it(`{ id: { type: 'INTEGER', references: { table: 'Bar' } } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', references: { table: 'Bar' } } }), {
      default: { id: 'INTEGER REFERENCES "Bar" ("id")' },
      'mariadb mysql sqlite': { id: 'INTEGER REFERENCES `Bar` (`id`)' },
      mssql: { id: 'INTEGER NULL REFERENCES [Bar] ([id])' },
    });
  });

  it(`{ id: { type: 'INTEGER', references: { table: 'Bar', key: 'pk' } } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', references: { table: 'Bar', key: 'pk' } } }), {
      default: { id: 'INTEGER REFERENCES "Bar" ("pk")' },
      'mariadb mysql sqlite': { id: 'INTEGER REFERENCES `Bar` (`pk`)' },
      mssql: { id: 'INTEGER NULL REFERENCES [Bar] ([pk])' },
    });
  });

  it(`{ id: { type: 'INTEGER', references: { table: 'Bar' }, onDelete: 'CASCADE' } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', references: { table: 'Bar' }, onDelete: 'CASCADE' } }), {
      default: { id: 'INTEGER REFERENCES "Bar" ("id") ON DELETE CASCADE' },
      'mariadb mysql sqlite': { id: 'INTEGER REFERENCES `Bar` (`id`) ON DELETE CASCADE' },
      mssql: { id: 'INTEGER NULL REFERENCES [Bar] ([id]) ON DELETE CASCADE' },
    });
  });

  it(`{ id: { type: 'INTEGER', references: { table: 'Bar' }, onUpdate: 'RESTRICT' } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', references: { table: 'Bar' }, onUpdate: 'RESTRICT' } }), {
      default: { id: 'INTEGER REFERENCES "Bar" ("id") ON UPDATE RESTRICT' },
      'mariadb mysql sqlite': { id: 'INTEGER REFERENCES `Bar` (`id`) ON UPDATE RESTRICT' },
      mssql: { id: 'INTEGER NULL REFERENCES [Bar] ([id])' },
    });
  });

  it(`{ id: { type: 'INTEGER', allowNull: false, autoIncrement: true, defaultValue: 1, references: { table: 'Bar' }, onDelete: 'CASCADE', onUpdate: 'RESTRICT' } }`, () => {
    expectPerDialect(() => queryGenerator.attributesToSQL({ id: { type: 'INTEGER', allowNull: false, autoIncrement: true, defaultValue: 1, references: { table: 'Bar' }, onDelete: 'CASCADE', onUpdate: 'RESTRICT' } }), {
      'mariadb mysql': { id: 'INTEGER NOT NULL auto_increment DEFAULT 1 REFERENCES `Bar` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT' },
      postgres: { id: 'INTEGER NOT NULL SERIAL DEFAULT 1 REFERENCES "Bar" ("id") ON DELETE CASCADE ON UPDATE RESTRICT' },
      mssql: { id: 'INTEGER NOT NULL IDENTITY(1,1) DEFAULT 1 REFERENCES [Bar] ([id]) ON DELETE CASCADE' },
      sqlite: { id: 'INTEGER NOT NULL DEFAULT 1 REFERENCES `Bar` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT' },
      snowflake: { id: 'INTEGER NOT NULL AUTOINCREMENT DEFAULT 1 REFERENCES "Bar" ("id") ON DELETE CASCADE ON UPDATE RESTRICT' },
      db2: { id: 'INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY(START WITH 1, INCREMENT BY 1) DEFAULT 1 REFERENCES "Bar" ("id") ON DELETE CASCADE ON UPDATE RESTRICT' },
      ibmi: { id: 'INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1, INCREMENT BY 1) DEFAULT 1 REFERENCES "Bar" ("id") ON DELETE CASCADE ON UPDATE RESTRICT' },
    });
  });
});

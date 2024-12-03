import { Mutex } from 'async-mutex';
import { writeFile } from 'fs/promises';

type SqlColumnType = "string" | "number"

type SqlColumn = {
  name: string,
  type: SqlColumnType
}

type SqlTable = {
  name: string,
  columns: SqlColumn[],
  values: string[][]
}

type SqlFile = {
  name: string
  tables: SqlTable[]
}

export class SqlConverter {
  private order: string[] = []
  private sqlFiles: SqlFile[] = []
  private mutex: Mutex = new Mutex()

  SqlConverter() { }

  public async addSql(fileName: string, tableName: string, types: string[], headers: string[], values: string[][]) {
    // console.log(tableName)
    const columns: SqlColumn[] = headers.map((v, i) => ({ name: v, type: types[i] as SqlColumnType }))
    const table: SqlTable = {
      name: tableName,
      columns,
      values
    }

    await this.mutex.runExclusive(async () => {
      const fileIndex = this.sqlFiles.findIndex(v => v.name == fileName)
      if (fileIndex !== -1) {
        this.sqlFiles[fileIndex].tables.push(table)
      } else {
        this.sqlFiles.push({
          name: fileName,
          tables: [table]
        })
      }
    })
  };

  public register(names: string[]) {
    this.order.push(...names)
  }

  public compile() {
    this.sqlFiles.forEach(sqlFile => {
      const sql = this.generateSql(sqlFile)
      this.writeSql(sqlFile.name, sql)
    })
  }

  private generateSql(sqlFile: SqlFile) {
    sqlFile.tables.sort((t1, t2) => this.order.findIndex(n => n === t1.name) - this.order.findIndex(n => n === t2.name))
    const sqlTables = sqlFile.tables.map((table) => {
      const types = table.columns.map(c => c.type)

      const sql = `INSERT INTO ${table.name} (${table.columns.map(c => c.name).filter(c => !c.startsWith('!')).join(', ')}) VALUES\n` +
        `${table.values.map((row) => {
          const values = `(${row
            .filter((_, i) => !table.columns[i].name.startsWith('!'))
            .map((v, i) => types[i] === 'number' || v == 'null' ? v : `'${v}'`)
            .join(',')})`

          return values
        }).join(',\n')}` +
        `\nON CONFLICT DO NOTHING;`

      return sql;
    })

    return sqlTables.join('\n\n')
  }

  private writeSql(fileName: string, content: string) {
    writeFile(`./sql/${fileName}`, content, 'utf8')
  }
}


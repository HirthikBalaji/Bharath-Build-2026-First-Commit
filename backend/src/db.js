const path = require('path');
const { spawnSync } = require('child_process');

const DB_PATH = process.env.SEATRELAY_DB_PATH
  ? path.resolve(process.env.SEATRELAY_DB_PATH)
  : path.resolve(__dirname, '../../backend/seatrelay.db');

class DatabaseService {
  /**
   * Run query via native Python sqlite3 engine (always available on macOS, rock-solid)
   */
  static query(sql, params = []) {
    const payload = JSON.stringify({ sql, params });
    const pyScript = `
import sqlite3, json, sys

data = json.loads(sys.stdin.read())
conn = sqlite3.connect('${DB_PATH}')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

try:
    cur.execute(data['sql'], data['params'])
    trimmed = data['sql'].strip().upper()
    if trimmed.startswith('SELECT') or 'RETURNING' in trimmed:
        rows = [dict(row) for row in cur.fetchall()]
        print(json.dumps({'success': True, 'rows': rows}))
    else:
        conn.commit()
        print(json.dumps({'success': True, 'rows': [], 'changes': cur.rowcount, 'lastrowid': cur.lastrowid}))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
finally:
    conn.close()
`;

    const res = spawnSync('python3', ['-c', pyScript], {
      input: payload,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });

    if (res.error) {
      throw new Error(`Database execution error: ${res.error.message}`);
    }

    try {
      const output = JSON.parse(res.stdout);
      if (!output.success) {
        throw new Error(output.error);
      }
      return output.rows;
    } catch (e) {
      throw new Error(`DB Output Parse Error: ${res.stderr || res.stdout}`);
    }
  }

  static get(sql, params = []) {
    const rows = this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  static run(sql, params = []) {
    this.query(sql, params);
    return true;
  }

  /**
   * Execute atomic transactions
   */
  static transaction(queries) {
    const payload = JSON.stringify(queries);
    const pyScript = `
import sqlite3, json, sys

queries = json.loads(sys.stdin.read())
conn = sqlite3.connect('${DB_PATH}')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

try:
    cur.execute("BEGIN TRANSACTION")
    results = []
    for q in queries:
        cur.execute(q['sql'], q['params'])
        trimmed = q['sql'].strip().upper()
        if trimmed.startswith('SELECT'):
            results.append([dict(row) for row in cur.fetchall()])
        else:
            results.append({'changes': cur.rowcount, 'lastrowid': cur.lastrowid})
    conn.commit()
    print(json.dumps({'success': True, 'results': results}))
except Exception as e:
    conn.rollback()
    print(json.dumps({'success': False, 'error': str(e)}))
finally:
    conn.close()
`;

    const res = spawnSync('python3', ['-c', pyScript], {
      input: payload,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });

    try {
      const output = JSON.parse(res.stdout);
      if (!output.success) {
        throw new Error(output.error);
      }
      return output.results;
    } catch (e) {
      throw new Error(`Transaction execution error: ${res.stderr || res.stdout}`);
    }
  }
}

module.exports = { DatabaseService, DB_PATH };

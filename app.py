from flask import Flask, render_template, request, jsonify
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__)

# Database setup
def init_db():
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            endereco TEXT NOT NULL,
            telefone TEXT NOT NULL,
            email TEXT,
            data_cadastro DATE DEFAULT CURRENT_DATE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ordens_servico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT NOT NULL,
            cliente TEXT NOT NULL,
            status TEXT NOT NULL,
            endereco TEXT NOT NULL,
            telefone TEXT NOT NULL,
            email TEXT,
            data_abertura DATE NOT NULL,
            data_autorizacao DATE,
            data_encerramento DATE,
            aparelho TEXT NOT NULL,
            marca TEXT NOT NULL,
            modelo TEXT NOT NULL,
            defeito TEXT NOT NULL,
            diagnostico TEXT NOT NULL,
            tecnico TEXT NOT NULL,
            pagamento TEXT NOT NULL,
            valor REAL NOT NULL,
            parcelas INTEGER DEFAULT 1,
            total REAL NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS garantias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT NOT NULL,
            os_numero TEXT NOT NULL,
            cobertura TEXT NOT NULL,
            pecas TEXT NOT NULL,
            contrato TEXT NOT NULL,
            data_criacao DATE DEFAULT CURRENT_DATE
        )
    ''')
    
    conn.commit()
    conn.close()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# API Routes
@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM clientes ORDER BY nome')
    clientes = []
    for row in cursor.fetchall():
        clientes.append({
            'id': row[0],
            'nome': row[1],
            'endereco': row[2],
            'telefone': row[3],
            'email': row[4],
            'data_cadastro': row[5]
        })
    conn.close()
    return jsonify(clientes)

@app.route('/api/clientes', methods=['POST'])
def create_cliente():
    data = request.json
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO clientes (nome, endereco, telefone, email)
        VALUES (?, ?, ?, ?)
    ''', (data['nome'], data['endereco'], data['telefone'], data.get('email', '')))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/clientes/<int:cliente_id>', methods=['PUT'])
def update_cliente(cliente_id):
    data = request.json
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE clientes 
        SET nome = ?, endereco = ?, telefone = ?, email = ?
        WHERE id = ?
    ''', (data['nome'], data['endereco'], data['telefone'], data.get('email', ''), cliente_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/clientes/<int:cliente_id>', methods=['DELETE'])
def delete_cliente(cliente_id):
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM clientes WHERE id = ?', (cliente_id,))
    cursor.execute('DELETE FROM ordens_servico WHERE cliente = (SELECT nome FROM clientes WHERE id = ?)', (cliente_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/ordens-servico', methods=['GET'])
def get_ordens_servico():
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM ordens_servico ORDER BY data_abertura DESC')
    ordens = []
    for row in cursor.fetchall():
        ordens.append({
            'id': row[0],
            'numero': row[1],
            'cliente': row[2],
            'status': row[3],
            'endereco': row[4],
            'telefone': row[5],
            'email': row[6],
            'dataAbertura': row[7],
            'dataAutorizacao': row[8],
            'dataEncerramento': row[9],
            'aparelho': row[10],
            'marca': row[11],
            'modelo': row[12],
            'defeito': row[13],
            'diagnostico': row[14],
            'tecnico': row[15],
            'pagamento': row[16],
            'valor': row[17],
            'parcelas': row[18],
            'total': row[19]
        })
    conn.close()
    return jsonify(ordens)

@app.route('/api/ordens-servico', methods=['POST'])
def create_ordem_servico():
    data = request.json
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO ordens_servico (
            numero, cliente, status, endereco, telefone, email,
            data_abertura, data_autorizacao, data_encerramento,
            aparelho, marca, modelo, defeito, diagnostico, tecnico,
            pagamento, valor, parcelas, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['numero'], data['cliente'], data['status'], data['endereco'],
        data['telefone'], data.get('email', ''), data['dataAbertura'],
        data.get('dataAutorizacao'), data.get('dataEncerramento'),
        data['aparelho'], data['marca'], data['modelo'], data['defeito'],
        data['diagnostico'], data['tecnico'], data['pagamento'],
        float(data['valor']), int(data['parcelas']), float(data['total'])
    ))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/ordens-servico/<int:os_id>', methods=['PUT'])
def update_ordem_servico(os_id):
    data = request.json
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE ordens_servico 
        SET cliente = ?, status = ?, endereco = ?, telefone = ?, email = ?,
            data_abertura = ?, data_autorizacao = ?, data_encerramento = ?,
            aparelho = ?, marca = ?, modelo = ?, defeito = ?, diagnostico = ?,
            tecnico = ?, pagamento = ?, valor = ?, parcelas = ?, total = ?
        WHERE id = ?
    ''', (
        data['cliente'], data['status'], data['endereco'], data['telefone'], 
        data.get('email', ''), data['dataAbertura'], data.get('dataAutorizacao'), 
        data.get('dataEncerramento'), data['aparelho'], data['marca'], 
        data['modelo'], data['defeito'], data['diagnostico'], data['tecnico'], 
        data['pagamento'], float(data['valor']), int(data['parcelas']), 
        float(data['total']), os_id
    ))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/garantias', methods=['GET'])
def get_garantias():
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM garantias ORDER BY data_criacao DESC')
    garantias = []
    for row in cursor.fetchall():
        garantias.append({
            'id': row[0],
            'nome': row[1],
            'telefone': row[2],
            'osNumero': row[3],
            'cobertura': row[4],
            'pecas': row[5],
            'contrato': row[6],
            'data_criacao': row[7]
        })
    conn.close()
    return jsonify(garantias)

@app.route('/api/garantias', methods=['POST'])
def create_garantia():
    data = request.json
    conn = sqlite3.connect('assistencia.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO garantias (nome, telefone, os_numero, cobertura, pecas, contrato)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['nome'], data['telefone'], data['osNumero'], 
          data['cobertura'], data['pecas'], data['contrato']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)

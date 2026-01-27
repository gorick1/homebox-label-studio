#!/usr/bin/env python3
"""Simple print server for DYMO label printers."""

import os
import tempfile
import logging
from flask import Flask, request, jsonify
from waitress import serve
import cups

PORT = int(os.environ.get('PORT', 5000))
HOST = os.environ.get('HOST', '0.0.0.0')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def get_dymo_printer():
    """Find and return the first DYMO printer name."""
    conn = cups.Connection()
    printers = conn.getPrinters()
    
    for printer_name in printers:
        if 'DYMO' in printer_name.upper():
            return printer_name
    
    # Use default if no DYMO found
    return conn.getDefault()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        conn = cups.Connection()
        printers = conn.getPrinters()
        return jsonify({'status': 'ok', 'printers': list(printers.keys())}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/print', methods=['POST'])
def print_label():
    """Print label endpoint."""
    try:
        lbl_content = request.data
        
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.lbl', delete=False) as f:
            f.write(lbl_content)
            temp_path = f.name
        
        try:
            printer_name = get_dymo_printer()
            conn = cups.Connection()
            job_id = conn.printFile(printer_name, temp_path, "Label", {'copies': '1'})
            
            return jsonify({'ok': True, 'message': 'Label sent to printer', 'job_id': job_id}), 200
        finally:
            os.unlink(temp_path)
                
    except Exception as e:
        logger.error(f"Print error: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Starting Print Proxy Server on {HOST}:{PORT}")
    serve(app, host=HOST, port=PORT)

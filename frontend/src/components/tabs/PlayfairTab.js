import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUnlock, FiRefreshCw, FiCopy, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import './PlayfairTab.css';

const PlayfairTab = () => {
  const [plaintext, setPlaintext] = useState('HELLO NETWORK SECURITY WORLD');
  const [key, setKey] = useState('NETWORK');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [keyMatrix, setKeyMatrix] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const handleEncrypt = async () => {
    if (!plaintext || !key) {
      setError('Please enter both plaintext and key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/playfair/encrypt', {
        plaintext,
        key
      });

      if (response.data.success) {
        setCiphertext(response.data.encrypted_text);
        setKeyMatrix(response.data.key_matrix || []);
      } else {
        setError(response.data.error || 'Encryption failed');
      }
    } catch (err) {
      setError('Error connecting to API');
      console.error('Encryption error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!ciphertext || !key) {
      setError('Please enter both ciphertext and key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/playfair/decrypt', {
        ciphertext,
        key
      });

      if (response.data.success) {
        setDecryptedText(response.data.decrypted_text);
      } else {
        setError(response.data.error || 'Decryption failed');
      }
    } catch (err) {
      setError('Error connecting to API');
      console.error('Decryption error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const generateRandomKey = () => {
    const words = ['NETWORK', 'SECURITY', 'CIPHER', 'CRYPTO', 'SECRET', 'MATRIX', 'PROTOCOL'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setKey(randomWord);
  };

  const generateRandomText = () => {
    const texts = [
      'HELLO NETWORK SECURITY WORLD',
      'SECURE COMMUNICATION PROTOCOL',
      'DATA ENCRYPTION AND DECRYPTION',
      'NETWORK SECURITY ALGORITHMS',
      'CRYPTOGRAPHIC CIPHER METHODS'
    ];
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    setPlaintext(randomText);
  };

  return (
    <div className="playfair-tab">
      <div className="tab-header">
        <div className="header-content">
          <h2>Playfair Cipher</h2>
          <p>Classical polyalphabetic substitution cipher using a 5×5 key matrix</p>
        </div>
        <div className="header-actions">
          <motion.button
            className="action-btn secondary"
            onClick={generateRandomKey}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Random Key
          </motion.button>
          <motion.button
            className="action-btn secondary"
            onClick={generateRandomText}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Random Text
          </motion.button>
        </div>
      </div>

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <div className="playfair-content">
        <div className="input-section">
          <div className="input-group">
            <label>Encryption Key</label>
            <div className="input-with-action">
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="Enter encryption key..."
                className="cyber-input"
              />
              <motion.button
                className="input-action-btn"
                onClick={generateRandomKey}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiRefreshCw />
              </motion.button>
            </div>
          </div>

          <div className="cipher-operations">
            <div className="operation-group">
              <label>Plaintext</label>
              <div className="textarea-with-actions">
                <textarea
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value.toUpperCase())}
                  placeholder="Enter text to encrypt..."
                  className="cyber-textarea"
                  rows="3"
                />
                <div className="textarea-actions">
                  <motion.button
                    className="text-action-btn"
                    onClick={() => copyToClipboard(plaintext, 'plaintext')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {copied === 'plaintext' ? <FiCheck /> : <FiCopy />}
                  </motion.button>
                </div>
              </div>
              <motion.button
                className="action-btn primary"
                onClick={handleEncrypt}
                disabled={loading || !plaintext || !key}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <FiRefreshCw />
                    </motion.div>
                    Encrypting...
                  </>
                ) : (
                  <>
                    <FiLock /> Encrypt
                  </>
                )}
              </motion.button>
            </div>

            <div className="operation-group">
              <label>Ciphertext</label>
              <div className="textarea-with-actions">
                <textarea
                  value={ciphertext}
                  onChange={(e) => setCiphertext(e.target.value.toUpperCase())}
                  placeholder="Encrypted text will appear here..."
                  className="cyber-textarea"
                  rows="3"
                />
                <div className="textarea-actions">
                  <motion.button
                    className="text-action-btn"
                    onClick={() => copyToClipboard(ciphertext, 'ciphertext')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {copied === 'ciphertext' ? <FiCheck /> : <FiCopy />}
                  </motion.button>
                </div>
              </div>
              <motion.button
                className="action-btn success"
                onClick={handleDecrypt}
                disabled={loading || !ciphertext || !key}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <FiRefreshCw />
                    </motion.div>
                    Decrypting...
                  </>
                ) : (
                  <>
                    <FiUnlock /> Decrypt
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {decryptedText && (
            <motion.div 
              className="result-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label>Decrypted Text</label>
              <div className="textarea-with-actions">
                <textarea
                  value={decryptedText}
                  readOnly
                  className="cyber-textarea result"
                  rows="2"
                />
                <div className="textarea-actions">
                  <motion.button
                    className="text-action-btn"
                    onClick={() => copyToClipboard(decryptedText, 'decrypted')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {copied === 'decrypted' ? <FiCheck /> : <FiCopy />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="matrix-section">
          <div className="matrix-container">
            <h3>Key Matrix (5×5)</h3>
            {keyMatrix && keyMatrix.length > 0 ? (
              <motion.div 
                className="key-matrix"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {keyMatrix.map((row, i) => (
                  <div key={i} className="matrix-row">
                    {row.map((cell, j) => (
                      <motion.div
                        key={`${i}-${j}`}
                        className="matrix-cell"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (i * 5 + j) * 0.05 }}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 212, 255, 0.2)' }}
                      >
                        {cell}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="matrix-placeholder">
                <p>Enter a key and encrypt text to see the key matrix</p>
              </div>
            )}
          </div>

          <div className="cipher-info">
            <h3>How Playfair Works</h3>
            <div className="info-steps">
              <div className="info-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Key Matrix</h4>
                  <p>Create a 5×5 matrix using the key and remaining alphabet letters</p>
                </div>
              </div>
              <div className="info-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Digraph Pairs</h4>
                  <p>Split plaintext into pairs of letters (digraphs)</p>
                </div>
              </div>
              <div className="info-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Encryption Rules</h4>
                  <p>Apply rectangle, row, or column rules based on letter positions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayfairTab;

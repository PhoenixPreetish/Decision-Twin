const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

class OfflineStore {
  constructor() {
    this.collections = new Map();
    this.isOffline = false;
    this.storageFile = path.join(__dirname, '..', 'data', 'offline_storage.json');
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw);
        for (const [coll, items] of Object.entries(data)) {
          this.collections.set(coll.toLowerCase(), Array.isArray(items) ? items : []);
        }
      }
    } catch (err) {
      console.warn('[OfflineStore] Notice: Fresh in-memory state initialized');
    }
  }

  saveToDisk() {
    try {
      const obj = {};
      for (const [coll, items] of this.collections.entries()) {
        obj[coll] = items.map(d => {
          const clean = { ...d };
          delete clean.save;
          delete clean.toObject;
          delete clean.comparePassword;
          return clean;
        });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.warn('[OfflineStore] Notice: In-memory persistence active');
    }
  }

  getCollection(name) {
    const collName = name.toLowerCase();
    if (!this.collections.has(collName)) {
      this.collections.set(collName, []);
    }
    return this.collections.get(collName);
  }

  generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  matches(doc, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, val] of Object.entries(filter)) {
      const docVal = doc[key];
      if (key === '_id' || key === 'userId' || key === 'scenarioId' || key === 'optionId' || key === 'id') {
        if ((docVal || '').toString() !== (val || '').toString()) return false;
      } else if (key === 'isWhatIfClone') {
        if (Boolean(docVal) !== Boolean(val)) return false;
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        if (JSON.stringify(docVal) !== JSON.stringify(val)) return false;
      } else {
        if (docVal !== val) return false;
      }
    }
    return true;
  }

  createDoc(collName, data) {
    const id = data._id ? data._id.toString() : this.generateId();
    const doc = {
      _id: id,
      id: id,
      isWhatIfClone: false,
      status: 'active',
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date()
    };

    doc.toObject = function() {
      const copy = { ...this };
      delete copy.toObject;
      delete copy.save;
      delete copy.comparePassword;
      return copy;
    };

    const self = this;
    doc.save = async function() {
      this.updatedAt = new Date();
      if (this.passwordHash && !this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
      }
      const coll = self.getCollection(collName);
      const idx = coll.findIndex(d => d._id === this._id);
      if (idx >= 0) {
        coll[idx] = this;
      } else {
        coll.push(this);
      }
      self.saveToDisk();
      return this;
    };

    if (collName === 'user' || collName === 'users') {
      doc.comparePassword = async function(entered) {
        return await bcrypt.compare(entered, this.passwordHash);
      };
    }

    return doc;
  }

  async insertOne(collName, data) {
    const doc = this.createDoc(collName, data);
    if (doc.passwordHash && !doc.passwordHash.startsWith('$2a$') && !doc.passwordHash.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      doc.passwordHash = await bcrypt.hash(doc.passwordHash, salt);
    }
    const coll = this.getCollection(collName);
    coll.push(doc);
    this.saveToDisk();
    return doc;
  }

  find(collName, filter = {}) {
    const coll = this.getCollection(collName);
    const results = coll.filter(d => this.matches(d, filter));
    return new QueryCursor(results.map(r => this.createDoc(collName, r)));
  }

  findOne(collName, filter = {}) {
    const coll = this.getCollection(collName);
    const items = coll.filter(d => this.matches(d, filter));
    const docs = items.map(item => this.createDoc(collName, item));
    return new SingleDocCursor(docs);
  }

  findById(collName, id) {
    return this.findOne(collName, { _id: id });
  }

  async findAndUpdate(collName, filter, update, options = {}) {
    let coll = this.getCollection(collName);
    let idx = coll.findIndex(d => this.matches(d, filter));
    let docData = (update && update['$set']) ? update['$set'] : update;

    if (idx >= 0) {
      coll[idx] = { ...coll[idx], ...docData, updatedAt: new Date() };
      this.saveToDisk();
      return this.createDoc(collName, coll[idx]);
    } else if (options.upsert) {
      const newDoc = { ...filter, ...docData };
      return await this.insertOne(collName, newDoc);
    }
    return null;
  }

  async findOneAndUpdate(collName, filter, update, options = {}) {
    return this.findAndUpdate(collName, filter, update, options);
  }

  async findOneAndDelete(collName, filter) {
    const coll = this.getCollection(collName);
    const idx = coll.findIndex(d => this.matches(d, filter));
    if (idx >= 0) {
      const removed = coll.splice(idx, 1)[0];
      this.saveToDisk();
      return this.createDoc(collName, removed);
    }
    return null;
  }

  async deleteMany(collName, filter) {
    const coll = this.getCollection(collName);
    const remaining = coll.filter(d => !this.matches(d, filter));
    const deletedCount = coll.length - remaining.length;
    this.collections.set(collName.toLowerCase(), remaining);
    this.saveToDisk();
    return { deletedCount, acknowledged: true };
  }

  async countDocuments(collName, filter = {}) {
    const coll = this.getCollection(collName);
    return coll.filter(d => this.matches(d, filter)).length;
  }
}

class SingleDocCursor {
  constructor(docs) {
    this.docs = Array.isArray(docs) ? docs : (docs ? [docs] : []);
  }

  get doc() {
    return this.docs[0] || null;
  }

  sort(criteria) {
    if (criteria && typeof criteria === 'object' && this.docs.length > 1) {
      for (const [key, dir] of Object.entries(criteria)) {
        this.docs.sort((a, b) => {
          let aVal = a[key] instanceof Date ? a[key].getTime() : (typeof a[key] === 'string' && !isNaN(Date.parse(a[key])) ? Date.parse(a[key]) : a[key]);
          let bVal = b[key] instanceof Date ? b[key].getTime() : (typeof b[key] === 'string' && !isNaN(Date.parse(b[key])) ? Date.parse(b[key]) : b[key]);
          if (dir === -1) return bVal > aVal ? 1 : (bVal < aVal ? -1 : 0);
          return aVal > bVal ? 1 : (aVal < bVal ? -1 : 0);
        });
      }
    }
    return this;
  }

  select(fields) {
    if (this.docs.length > 0 && typeof fields === 'string' && fields.startsWith('-')) {
      const omitField = fields.substring(1);
      this.docs = this.docs.map(d => {
        const copy = { ...d };
        delete copy[omitField];
        return copy;
      });
    }
    return this;
  }

  populate() {
    return this;
  }

  lean() {
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.doc).then(resolve, reject);
  }

  catch(reject) {
    return Promise.resolve(this.doc).catch(reject);
  }
}

class QueryCursor {
  constructor(results) {
    this.results = results || [];
  }

  sort(criteria) {
    if (criteria && typeof criteria === 'object') {
      for (const [key, dir] of Object.entries(criteria)) {
        this.results.sort((a, b) => {
          let aVal = a[key] instanceof Date ? a[key].getTime() : (typeof a[key] === 'string' && !isNaN(Date.parse(a[key])) ? Date.parse(a[key]) : a[key]);
          let bVal = b[key] instanceof Date ? b[key].getTime() : (typeof b[key] === 'string' && !isNaN(Date.parse(b[key])) ? Date.parse(b[key]) : b[key]);
          if (dir === -1) return bVal > aVal ? 1 : (bVal < aVal ? -1 : 0);
          return aVal > bVal ? 1 : (aVal < bVal ? -1 : 0);
        });
      }
    }
    return this;
  }

  select(fields) {
    if (typeof fields === 'string' && fields.startsWith('-')) {
      const omitField = fields.substring(1);
      this.results.forEach(r => { delete r[omitField]; });
    }
    return this;
  }

  populate() {
    return this;
  }

  lean() {
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.results).then(resolve, reject);
  }

  catch(reject) {
    return Promise.resolve(this.results).catch(reject);
  }
}

const offlineStore = new OfflineStore();

function wrapModel(Model, collName) {
  return new Proxy(Model, {
    get(target, prop) {
      if (mongoose.connection.readyState !== 1) {
        // Intercept when offline
        if (prop === 'create') {
          return async (...args) => {
            const data = args[0];
            return await offlineStore.insertOne(collName, data);
          };
        }
        if (prop === 'find') {
          return (filter) => offlineStore.find(collName, filter);
        }
        if (prop === 'findOne') {
          return (filter) => offlineStore.findOne(collName, filter);
        }
        if (prop === 'findById') {
          return (id) => offlineStore.findById(collName, id);
        }
        if (prop === 'findOneAndUpdate') {
          return (filter, update, options) => offlineStore.findOneAndUpdate(collName, filter, update, options);
        }
        if (prop === 'findOneAndDelete') {
          return (filter) => offlineStore.findOneAndDelete(collName, filter);
        }
        if (prop === 'deleteMany') {
          return (filter) => offlineStore.deleteMany(collName, filter);
        }
        if (prop === 'countDocuments') {
          return (filter) => offlineStore.countDocuments(collName, filter);
        }
      }
      return Reflect.get(target, prop);
    }
  });
}

module.exports = { offlineStore, OfflineStore, wrapModel };

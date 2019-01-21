###############################################################################
# Web Technology at VU University Amsterdam
# Plugins to kickstart implementation of a RESTful API for Assignment 3
#
# Install these plugins just before you call 'run()' with
# 'install(WtDbPlugin())' and 'install(WtCorsPlugin())'.
# This has already been done in the server.py example code!
#
# The MIT License (MIT)
#
# Copyright (c) 2014-2019 VU University Amsterdam
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
###############################################################################

import sqlite3
import copy
import os
import inspect
from bottle import response, HTTPError, PluginError


class WtDbPlugin(object):
    '''Plugin for bottle.py to kickstart implementing a RESTful API for
    Assignment 3 of the course Web Technology at VU University Amsterdam

    This plugin provides database access.
    '''
    name = 'wtdbplugin'
    api = 2

    # Configuration for database
    dbfile = 'inventory.db'
    keyword = 'db'

    def setup(self, app):
        '''Make sure plugin is only loaded once and setup DB
        '''
        for other in app.plugins:
            if isinstance(other, WtDbPlugin):
                raise PluginError('WtDbPlugin is already installed')

        # Connecting to database creates it if it doesn't exist
        self.db_connect().close()

    def setup_db(self, db):
        '''Setup database

        Creates table 'supermarket' if not present
        '''
        c = db.cursor()

        # Create table and insert one dummy item if table doesn't exist
        c.execute("SELECT name FROM sqlite_master WHERE type='table' and name='supermarket'")
        result = c.fetchone()
        if not result or u'supermarket' not in result:
            c.executescript("""
            CREATE TABLE IF NOT EXISTS supermarket
                    (id INTEGER PRIMARY KEY,
                     product CHAR(100) NOT NULL,
                     origin CHAR(100) NOT NULL,
                     amount INTEGER NOT NULL,
                     image char(254) NOT NULL,
                     best_before_date CHAR(12) NOT NULL);
            INSERT INTO supermarket (product, origin, best_before_date, amount, image) VALUES
                    ("Apples", "The Netherlands", "November 2019", "100kg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Apples.jpg/512px-Apples.jpg");
            INSERT INTO supermarket (product, origin, best_before_date, amount, image) VALUES
                    ("Banana", "India", "February 2019", "120kg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Bananas.jpg/640px-Bananas.jpg");
            """)
            db.commit()

    def apply(self, callback, context):
        '''Inject a database connection in routes
        '''
        # Test if the original callback accepts a 'db' keyword.
        # Ignore it if it does not need a database handle.
        args = inspect.getargspec(context.callback)[0]
        if self.keyword not in args:
            return callback

        def wrapper(*args, **kwargs):
            '''Wrapper around original callback
            '''
            db = self.db_connect()
            # Add the connection handle as a keyword argument.
            kwargs[self.keyword] = db.cursor()

            try:
                rv = callback(*args, **kwargs)
                db.commit()
            except sqlite3.IntegrityError, e:
                db.rollback()
                raise HTTPError(500, "Database Error", e)
            finally:
                db.close()

            return rv # Return value from callback

        # Replace the route callback with the wrapped one.
        return wrapper

    def db_connect(self):
        '''Connect to database and return handle
        '''
        def dict_factory(cursor, row):
            '''Factory for rows from database

            Makes sure everything returned from database is a dictionary with
            column names as keys
            '''
            d = {}
            for idx, col in enumerate(cursor.description):
                d[col[0]] = row[idx]
            return d

        # Connect to database. Creates file if removed since setup
        db = sqlite3.connect(self.dbfile)

        # Restore default table if database file was removed since setup
        self.setup_db(db)

        # Configure connection to return all results as dicts
        db.row_factory = dict_factory

        return db


class WtCorsPlugin(object):
    '''Plugin for bottle.py to kickstart implementing a RESTful API for
    assignment 3 of the course Web Technology at VU University Amsterdam

    This plugin enables CORS
    '''
    name = 'wtcorsplugin'
    api = 2

    # Configuration to enable CORS
    ttl = 3600
    allow_origin = '*'
    preflight_methods = ['GET', 'POST', 'PUT', 'DELETE']

    def __init__(self):
        self.methods = {}

    def setup(self, app):
        '''Make sure plugin is only loaded once and setup CORS
        '''
        for other in app.plugins:
            if isinstance(other, WtCorsPlugin):
                raise PluginError('WtCorsPlugin is already installed')

        # Add hook to insert headers
        app.add_hook('after_request', self.prepare_cors_headers())

        # Add OPTIONS routes for each existing route
        for r in list(app.routes):
            if r.method in self.preflight_methods:
                # Store method for this rule
                self.methods.setdefault(r.rule, []).append(r.method)

                # Create a new OPTIONS route for the same rule
                options_route = copy.copy(r)
                options_route.method = 'OPTIONS'
                options_route.callback = self.prepare_preflight_route(
                        self.methods[r.rule])
                options_route.reset()
                r.app.add_route(options_route)

    def apply(self, callback, context):
        '''Do nothing. Everything is taken care of in setup() already.
        '''
        return callback

    def prepare_cors_headers(self):
        '''Prepare closure to add appropriate headers to all routes
        '''
        def cors_headers():
            '''Sets correct headers
            '''
            response.set_header('Access-Control-Allow-Origin', self.allow_origin)
        return cors_headers

    def prepare_preflight_route(self, methods):
        '''Prepare closure for all OPTIONS routes
        '''
        def preflight_route(*args, **kwargs):
            '''OPTIONS route handler to enable CORS
            '''

            # Add headers expected from a response to an OPTIONS request
            response.set_header('Access-Control-Allow-Methods', ', '.join(methods))
            response.set_header('Access-Control-Allow-Headers',
                    'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token')
            response.set_header('Access-Control-Max-Age', self.ttl)
            return

        # Return OPTIONS route
        return preflight_route

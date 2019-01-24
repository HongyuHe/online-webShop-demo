from bottle import route, response, error, get
from bottle import *
import json
import random
# import os

@get('/')
def hello_world():

    response_body = {'Hello': 'World'}

    response.headers['Content-Type'] = 'application/json'
    return json.dumps(response_body)

###############################################################################
# CRUD operations

# Functionality_1: retrieve the full data set
@route('/products', method='GET')
def products(db):

    try:
        db.execute("SELECT * FROM supermarket")
        products = db.fetchall()
    except:
        #  Internal Server Error
        abort(500)
        return
    

    response.headers['Content-Type'] = 'application/json'
    return json.dumps(products)

# Functionality_2: to add data for a new product item (Create)
@route('/products/create', method='POST')
def products_create(db):

    try:
        db.execute("SELECT id FROM supermarket")
        products_id = db.fetchall()
        all_id = []
        db.execute("SELECT * FROM supermarket")
        products_attrs = [tuple[0] for tuple in db.description]
    except:
        #  Internal Server Error         
        abort(500)
        return

    try:
        try:
            new_item = json.load(request.body)                   
        except:
            raise ValueError

        if new_item is None:
            raise ValueError
    
        for key in new_item:
            if key not in products_attrs:
                raise KeyError

        for _key in products_attrs:
            if _key == 'id': continue
            if _key not in new_item.keys():
                raise KeyError

    except ValueError:
        # if bad request data, return 400 Bad Request
        abort(400, 'Bad request data')
    except KeyError:
        # if attributs missing, return 404 Not found
        abort(400, 'Missing attributs. Please check your submission again!')

    # Genarate random id:
    rand_id = random.randint(1,1000)
    for id_attr in products_id:
        all_id.append(id_attr['id'])

    while True:
        if rand_id in all_id:
            rand_id = random.randint(1,1000)
        else:
            break

    try:
        db.execute('''INSERT INTO supermarket 
        (origin, product, best_before_date, image, amount, id) 
        VALUES('%s', '%s', '%s', '%s', '%s', '%s');
        '''%( new_item['origin'], new_item['product'], new_item['best_before_date'], new_item['image'], new_item['amount'], rand_id))
    except:
        #  Internal Server Error         
        abort(500)
        return

    response.headers['Content-Type'] = 'application/json'
    return json.dumps({'URI': 'http://localhost:8874/products/%d'%rand_id})

# Functionality_3: to list the data of a specific item (Retrieve)

@route('/products/<id>', method='GET')
def products_id(db, id):

    try:
        db.execute("SELECT * FROM supermarket WHERE id=%s"%id)
        product = db.fetchall()
    except:
        #  Internal Server Error         
        abort(500)
        return

    try:
        if not product:
            raise ValueError      
    except ValueError:
        abort(404, 'The ID is wrong')
        return 

    response.headers['Content-Type'] = 'application/json'
    return json.dumps(product)

# Functionality_4: to change data of a specific item (Update)
@route('/products/edit', method='PUT')
def products_edit(db):

    try:
        id = (json.load(request.body))['id']
    except:
        #  Internal Server Error         
        abort(500)
        return

    # Check existence
    all_id = []
    try:
        db.execute("SELECT id FROM supermarket")
        products_id = db.fetchall()
    except:
        #  Internal Server Error         
        abort(500)
        return

    try:
        try:
            new_item = json.load(request.body)              
        except:
            raise ValueError
        
        if new_item is None:
            raise ValueError

        for id_attr in products_id:
            all_id.append(id_attr['id'])

        if int(id) not in all_id:
            raise KeyError
        
    except ValueError:
        # if bad request data, return 400 Bad Request
        abort(400, 'Bad request data')
    except KeyError:
        abort(404, 'The ID dose not exist!')
        return 
    try:
        for key, values in new_item.items():
            db.execute("UPDATE supermarket SET %s = '%s' WHERE id = %s"%(key, values, id))
    except:
        #  Internal Server Error         
        abort(500)
        return

    # return a response with an empty body and a 200 status code
    return

# Functionality_5: to remove data of a specific item (Delete)
@route('/products/delete', method='DELETE')
def products_delete(db):

    all_id = []
    try:
        id = (json.load(request.body))['id']
    except:
        #  Internal Server Error         
        abort(500)
        return

    try:
        db.execute("SELECT id FROM supermarket")
        products_id = db.fetchall()
    except:
        #  Internal Server Error         
        abort(500)
        return

    # Check existence
    try:
        for id_attr in products_id:
            all_id.append(id_attr['id'])

        if int(id) not in all_id:
            raise KeyError     
    except KeyError:
        abort(404, 'The ID dose not exist!')
        return

    try:
        db.execute("DELETE from supermarket where id=%s"%id)
    except:
        #  Internal Server Error         
        abort(500)
        return

    return

# Reset Database:
@route('/products/reset', method='DELETE')
def products_reset(db):
    try:
        db.execute("DELETE FROM supermarket WHERE id <> 1 AND id <> 2;")
    except:
        #  Internal Server Error         
        abort(500)
        return
    return

###############################################################################
# Error handling
@error(400)
def Error_400(error):
    response.headers['Content-Type'] = 'application/json'
    return json.dumps({
        'error_status': 400,
        'response': error.body
        })

@error(404)
def Error_404(error):
    response.headers['Content-Type'] = 'application/json'
    return json.dumps({
        'error_status': 404,
        'response': error.body
        })

@error(500)
def Error_500(error):
    response.headers['Content-Type'] = 'application/json'
    return json.dumps({
        'error_status': 500,
        'response': 'Something happened in the server. Please try it again.'
        })

###############################################################################
# This starts the server
# Access it at http://localhost:8874
if __name__ == "__main__":
    from bottle import install, run
    from wtplugin import WtDbPlugin, WtCorsPlugin

    install(WtDbPlugin())
    install(WtCorsPlugin())

    # print("PID: ",os.getpid())
    run(host='localhost', port=8874, reloader=True, debug=True, autojson=False)

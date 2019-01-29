package main

import (
	"fmt"
	"log"     // Debug
	"os"      // Check if "./inventory.db" is exist
	"reflect" // Range over structure

	"database/sql"
	"encoding/json"
	"io/ioutil" // ioutil.ReadAll()
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type Product struct {
	ID             int    `json:"id"`
	Product        string `json:"product"`
	Origin         string `json:"origin"`
	Amount         string `json:"amount"`
	Image          string `json:"image"`
	BestBeforeDate string `json:"best_before_date"`
}

type Err struct {
	ErrorStatus int    `json:"error_status"`
	Response    string `json:"response"`
}

type Response struct {
	ID int `json:"id"`
}

var database *sql.DB

func main() {

	var is_exist bool
	is_exist, _ = PathExists("./inventory.db")

	if !is_exist {
		database, _ = sql.Open("sqlite3", "./inventory.db")
		database.Exec(`CREATE TABLE IF NOT EXISTS supermarket
							(id INTEGER PRIMARY KEY,
							product CHAR(100) NOT NULL,
							origin CHAR(100) NOT NULL,
							amount INTEGER NOT NULL,
							image char(254) NOT NULL,
							best_before_date CHAR(12) NOT NULL);
		INSERT INTO supermarket (product, origin, best_before_date, amount, image) VALUES
			("Apples", "The Netherlands", "November 2019", "100kg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Apples.jpg/512px-Apples.jpg");
		INSERT INTO supermarket (product, origin, best_before_date, amount, image) VALUES
			("Banana", "India", "February 2019", "120kg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Bananas.jpg/640px-Bananas.jpg");`)
	} else {
		database, _ = sql.Open("sqlite3", "./inventory.db")
	}

	http.HandleFunc("/products", Products)
	http.HandleFunc("/products/create", ProductsCreate)
	http.HandleFunc("/products/id", ProductsID)
	http.HandleFunc("/products/edit", ProductsEdit)
	http.HandleFunc("/products/delete", ProductsDelete)
	http.ListenAndServe(":8080", nil)

}

/* Check if database is exist */
func PathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

/****************************************************************************
*	CRUD operations
*****************************************************************************/

/* Functionality_1: retrieve the full data set */
func Products(w http.ResponseWriter, r *http.Request) {
	log.Printf("[%s] %q\n", r.Method, r.URL.String())

	if r.Method != "GET" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(Err{405, "Method Not Allowed"})

		return
	}

	var item Product
	var products []Product
	rows, err := database.Query("SELECT * FROM supermarket")
	if err != nil {
		w.Header().Set("Content-type", "application/json")
		json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
		return
	}

	for rows.Next() {
		rows.Scan(&item.ID, &item.Product, &item.Origin, &item.Amount, &item.Image, &item.BestBeforeDate)
		products = append(products, item)
		// fmt.Printf("%d %s %s %s %s %s\n", id, product, origin, amount, image, best_before_date)
	}
	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(products)
}

/* Functionality_2: to add data for a new product item (Create) */
func ProductsCreate(w http.ResponseWriter, r *http.Request) {
	log.Printf("[%s] %q\n", r.Method, r.URL.String())

	if r.Method != "POST" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(Err{405, "Method Not Allowed"})

		return
	}
	// Read body
	b, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	// Unmarshal
	var new_product Product
	err = json.Unmarshal(b, &new_product)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	rows, err := database.Query("SELECT * FROM supermarket")
	if err != nil {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
		return
	}
	var count int
	for rows.Next() {

		count += 1
	}

	stmtIns, err := database.Prepare("INSERT INTO supermarket (product, origin, amount, image, best_before_date, id) VALUES(?, ?, ?, ?, ?, ?)")
	if err != nil {
		panic(err.Error())
	}
	new_product.ID = count + 1
	_, err = stmtIns.Exec(new_product.Product, new_product.Origin, new_product.Amount, new_product.Image, new_product.BestBeforeDate, new_product.ID)
	fmt.Printf("ID: %d\n", new_product.ID)
	if err != nil {
		log.Fatal(err)
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
		return
	}

	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(Response{new_product.ID})
}

/* Functionality_3: to list the data of a specific item (Retrieve) */
func ProductsID(w http.ResponseWriter, r *http.Request) {
	log.Printf("[%s] %q\n", r.Method, r.URL.String())

	if r.Method != "GET" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(Err{405, "Method Not Allowed"})

		return
	}
	// Read body
	b, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	// Unmarshal
	var item Product
	err = json.Unmarshal(b, &item)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	rows, err := database.Query("SELECT * FROM supermarket WHERE id=$1", item.ID)
	if err != nil {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
		return
	}
	for rows.Next() {
		rows.Scan(&item.ID, &item.Product, &item.Origin, &item.Amount, &item.Image, &item.BestBeforeDate)
	}
	if item.Product == "" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(Err{404, "The ID is wrong"})
		return
	}

	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(item)
}

/* Functionality_4: to change data of a specific item (Update) */
func ProductsEdit(w http.ResponseWriter, r *http.Request) {
	log.Printf("[%s] %q\n", r.Method, r.URL.String())

	if r.Method != "PUT" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(Err{405, "Method Not Allowed"})

		return
	}
	// Read body
	b, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	// Unmarshal
	var edit_product Product
	err = json.Unmarshal(b, &edit_product)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	var item Product
	rows, err := database.Query("SELECT * FROM supermarket WHERE id=$1", edit_product.ID)
	if err != nil {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
		return
	}
	for rows.Next() {
		rows.Scan(&item.ID, &item.Product, &item.Origin, &item.Amount, &item.Image, &item.BestBeforeDate)
	}
	if item.Product == "" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(Err{404, "The ID is wrong"})
		return
	}

	attr := [6]string{"id", "product", "origin", "amount", "image", "best_before_date"}
	product_struct := reflect.ValueOf(edit_product)
	for i := 1; i < product_struct.NumField(); i++ {

		if product_struct.Field(i).String() != "" {
			statement := "UPDATE supermarket SET " + attr[i] + "=? WHERE id =?"
			stmtIns, err := database.Prepare(statement)
			if err != nil {
				panic(err.Error())
			}
			_, err = stmtIns.Exec(product_struct.Field(i).String(), edit_product.ID)
			if err != nil {
				log.Fatal(err)
				w.Header().Set("Content-type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
				return
			}
			// fmt.Printf("%s: %s\n", attr[i], product_struct.Field(i).String())
		}
	}
}

/* Functionality_5: to remove data of a specific item (Delete) */
func ProductsDelete(w http.ResponseWriter, r *http.Request) {
	log.Printf("[%s] %q\n", r.Method, r.URL.String())

	if r.Method != "DELETE" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(Err{405, "Method Not Allowed"})

		return
	}
	// Read body
	b, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	// Unmarshal
	var item Product
	err = json.Unmarshal(b, &item)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, err.Error(), 500)
		return
	}

	rows, err := database.Query("SELECT * FROM supermarket WHERE id=$1", item.ID)
	if err != nil {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
		return
	}
	for rows.Next() {
		rows.Scan(&item.ID, &item.Product, &item.Origin, &item.Amount, &item.Image, &item.BestBeforeDate)
	}
	if item.Product == "" {
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(Err{404, "The ID is wrong"})
		return
	}

	_, err = database.Exec("DELETE FROM supermarket WHERE id=$1", item.ID)
	if err != nil {
		log.Fatal(err)
		w.Header().Set("Content-type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(Err{500, "Something happened in the server. Please try it again."})
		return
	}
}

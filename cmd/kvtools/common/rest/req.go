package rest

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

// MakeReq HTTP request helper
func MakeReq(url string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// 	// TODO: generalize this to accept any JSON param
	// 	if convert != "" {
	// 		q := url.Values{}
	// 		q.Add("convert", convert)
	// 		req.Header.Set("Accepts", "application/json")
	// 		req.URL.RawQuery = q.Encode()
	// 	}

	resp, err := doReq(req)
	if err != nil {
		return nil, err
	}

	return resp, err
}

// doReq HTTP client
func doReq(req *http.Request) ([]byte, error) {
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if 200 != resp.StatusCode {
		return nil, fmt.Errorf("%s", body)
	}

	return body, nil
}

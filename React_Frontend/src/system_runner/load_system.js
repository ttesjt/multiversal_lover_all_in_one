export class SystemLoader{
    constructor() {
        this.request_url = "https://jnmy2pux91.execute-api.us-west-1.amazonaws.com/User_Live";
    }

    async post_to_database_url(request_json) {
        const finished_response = await fetch(this.request_url, {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json'
          },
          body: JSON.stringify(request_json)
        })
        .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          return data; // Return the data so it gets passed to the termination callback
        })
        .catch(error => {
          console.error('Error:', error);
        });
        
        return finished_response;
    }

    async post_file_to_presigned_url(presignedPostData, file) {
      const formData = new FormData();
      // Add all the fields from the response to the FormData
      Object.keys(presignedPostData.fields).forEach((key) => {
        formData.append(key, presignedPostData.fields[key]);
      });
    
      // Append the file to the FormData
      formData.append('file', file);
    
      // Send the POST request to the presigned URL
      const response = await fetch(presignedPostData.url, {
        method: 'POST',
        body: formData,
      });
    
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      return response;
    }

    async load_data_from_url(url) {
      return await fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to download");
        }
        return response.blob();
      })
      .then(async (blob) => {
        const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsText(blob);
        });
        
        // return the data loaded form the url
        return fileContent;
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }

    /* async extruct_data_from_url(url) {
      console.log("data_file: ", url)
      const file_content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(data_file);
      });
      
      console.log("converted file content: ", file_content)
      return file_content;
    }

    async extruct_data_array_from_url(url) {
      const file_content = await this.extruct_data_from_file(url)
      
      let data_array = file_content.split(/(?=data:)/);
      for (let i = 0; i < data_array.length; i++) {
        if (data_array[i].endsWith(",")) {
          data_array[i] = data_array[i].slice(0, -1);
        }
      }
      return data_array;
    }*/
}
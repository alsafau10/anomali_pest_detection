// File input and drag-and-drop functionality
const iouSlider = document.getElementById('iou-slider');
const nmsSlider = document.getElementById('nms-slider');
const iouValue = document.getElementById('iou-value');
const nmsValue = document.getElementById('nms-value');
const applyButton = document.getElementById('apply-thresholds');
const resultImage = document.getElementById('result-image');
const downloadModelZipButton = document.getElementById('download-model-zip');

let iouThreshold = 0.5; 
let nmsThreshold = 0.5; 
///model download
const fileInput = document.querySelector('#file');
const base64Input = document.querySelector('#image_base64');
const browseButton = document.querySelector('.button');
const dropArea = document.querySelector('.drag-area');
const previewContainer = document.querySelector('#preview-container');

// Trigger file input when browse button is clicked
browseButton.onclick = () => {
  fileInput.click();
};

// Show preview when a file is selected
fileInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    showFile(file);
  }
});

// Handle drag-and-drop events
dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropArea.classList.add('active');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('active');
});

dropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  dropArea.classList.remove('active');

  const file = event.dataTransfer.files[0];
  if (file) {
    fileInput.files = event.dataTransfer.files; 
    showFile(file);
  }
});

function showFile(file) {
  const validExtensions = ['image/jpeg', 'image/jpg', 'image/png'];
  if (validExtensions.includes(file.type)) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const fileURL = fileReader.result;

      
      previewContainer.innerHTML = `
                <img src="${fileURL}" alt="Uploaded Image" style="width: 200px; height: 200px; object-fit: cover; margin-top: 10px;">
            `;

      
      base64Input.value = fileURL;
    };
    fileReader.readAsDataURL(file);
  } else {
    alert(
      'This file type is not supported. Please upload a JPG, JPEG, or PNG file.'
    );
  }
}

// Sliders for IoU and NMS thresholds

// When the browse button is clicked
// browseButton.onclick = () => {
//   input.click();
// };

// form.onsubmit = (e) => {
//   const input = document.querySelector('#file');
//   if (!input.files || input.files.length === 0) {
//     alert('Please select a file before submitting.');
//     e.preventDefault(); // Prevent form submission
//   }
// };

// // When a file is selected using the file input
// input.addEventListener('change', function () {
//   const file = this.files[0];
//   if (file) {
//     showFile(file);
//   }
// });

// // When a file is dragged over the drag area
// dropArea.addEventListener('dragover', (event) => {
//   event.preventDefault();
//   dropArea.classList.add('active');
// });

// dropArea.addEventListener('dragleave', () => {
//   dropArea.classList.remove('active');
// });

// dropArea.addEventListener('drop', (event) => {
//   event.preventDefault();
//   dropArea.classList.remove('active');

//   const file = event.dataTransfer.files[0];
//   if (file) {
//     fileInput.files = event.dataTransfer.files; // Assign the dropped file to the input
//     showFile(file);
//   }
// });

// // Function to display the uploaded image
// function showFile(file) {
//   const validExtensions = ['image/jpeg', 'image/jpg', 'image/png'];
//   if (validExtensions.includes(file.type)) {
//     const fileReader = new FileReader();
//     fileReader.onload = () => {
//       const fileURL = fileReader.result;
//       const previewContainer = document.querySelector('.drag-area');
//       previewContainer.innerHTML = `
//               <img src="${fileURL}" alt="Uploaded Image" style="width: 200px; height: 200px; object-fit: cover; margin-top: 10px;">
//           `;
//     };
//     fileReader.readAsDataURL(file);
//   } else {
//     alert(
//       'This file type is not supported. Please upload a JPG, JPEG, or PNG file.'
//     );
//   }
// }

// Update IoU slider value dynamically
iouSlider.oninput = () => {
  iouThreshold = parseFloat(iouSlider.value);
  iouValue.textContent = iouThreshold.toFixed(2);
};

// Update NMS slider value dynamically
nmsSlider.oninput = () => {
  nmsThreshold = parseFloat(nmsSlider.value);
  nmsValue.textContent = nmsThreshold.toFixed(2);
};

// // Apply thresholds and request backend for updated results
// applyButton.onclick = () => {
//   if (!resultImage) {
//     alert('Please upload and process an image first!');
//     return;
//   }

//   fetch('/update-thresholds', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       iou_threshold: iouThreshold,
//       nms_threshold: nmsThreshold,
//     }),
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.img_path) {
//         resultImage.src = `/static/image/result/${
//           data.img_path
//         }?t=${new Date().getTime()}`; // Prevent caching
//       }
//     })
//     .catch((err) => console.error('Error:', err));
// };

downloadModelZipButton.onclick = () => {
  fetch('/download-model-zip', { method: 'GET' })
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch((err) => console.error('Error:', err));
};

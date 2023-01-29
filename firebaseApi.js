import { db } from "./firebaseConfig.js";
import { collection, Firestore, getDoc, addDoc, query, where, doc, setDoc } from "firebase/firestore";
import { storage } from "./firebaseConfig.js";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { handleAsyncErr } from "./middleware/handleAsyncErr.js";
import HandErr from "./utils/err.js";
import { async } from "@firebase/util";

export const getLibraryData = () => {
  return getDocs(collection(db, "Library")).then((querySnapshot) => {
    let dataItems = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      dataItems.push(data);
    });

    let result = {};

    // Populate with grades first
    dataItems.forEach((item) => {
      result = {
        ...result,
        [item.grade]: {},
      };
    });

    // Populate with subjects
    dataItems.forEach((item) => {
      result = {
        ...result,
        [item.grade]: {
          ...result[item.grade],
          [item.subject]: {},
        },
      };
    });

    // Lastly populate with lessons
    dataItems.forEach((item) => {
      result = {
        ...result,
        [item.grade]: {
          ...result[item.grade],
          [item.subject]: {
            ...result[item.grade][item.subject],
            [item.title]: {
              audio: item.audio,
              author: item.author,
              genre: item.genre,
              image: item.image,
              summary: item.summary,
              title: item.title,
            },
          },
        },
      };
    });

    return result;
  });
};
// function to upload a story to firebase
// takes title, audio, file and highlightText as parameters
export const uploadStory = async (title, audio, text) => {

  const file = audio
  const storageRef = ref(storage, `files/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);
  // uploading the file
  uploadTask.on("state_changed",
    (snapshot) => {
      const progress =
        Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      console.log("Upload is " + progress + "% done");
    },
    (error) => {
      alert(error);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
        console.log(downloadURL);
        const docRef = await addDoc(collection(db, "Library"),
          {
            title,
            audio: downloadURL,
            text,
          });

      });
    }
  );
  // return once upload is complete
  return uploadTask;

}

import { db } from "../firebaseConfig.js";
import { collection, Firestore, getDoc, addDoc, query, where, doc, setDoc, getDocs } from "firebase/firestore";
import { storage } from "../firebaseConfig.js";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { handleAsyncErr } from "../middleware/handleAsyncErr.js";
import HandErr from "../utils/err.js";
import { async } from "@firebase/util";

// function to upload a story to firebase
// takes title, audio, file and highlightText as parameters
export const uploadStory = async (req, res) => {
    const audio = await req.files.audio[0]
    const image = await req.files.image[0]
    const { title, text } = await req.body
    console.log(req.body)
    try {
        const storageRef = ref(storage, `audio/${audio.originalname}`);
        const uploadTask = uploadBytesResumable(storageRef, audio.buffer);
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
                getDownloadURL(uploadTask.snapshot.ref).then(async (audioURL) => {

                    const imageRef = ref(storage, `images/${image.originalname}`);
                    const uploadTask = uploadBytesResumable(imageRef, image.buffer);
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
                        async () => {
                            const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            // add imageUrl to the story object
                            console.log(title, audioURL, text, imageUrl)
                            await setDoc(doc(db, "Library", title), {
                                title: title,
                                audio: audioURL,
                                text: text,
                                image: imageUrl
                            });
                            res.status(200).json({
                                success: true,
                                message: "Story added",
                            });
                        }
                    );
                });
            }
        );
        // return once upload is complete
    }
    catch (e) {
        console.error("Error: ", e);
    }

}

export const getStories = async (req, res) => {
    try {
        getDocs(collection(db, "Library")).then((querySnapshot) => {
            let dataItems = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();

                dataItems.push(data);
            });
            res.status(200).json({
                success: true,
                message: "stories fetched",
                dataItems

            });
        }
        )
    } catch (error) {
        console.log(error);
        return null;
    }
}
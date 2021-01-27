import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, TextInput, Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../Config'
import { add } from 'react-native-reanimated';

export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedStudentId: "",
      scannedBookId: "",
      transactionMessage: "",
    }
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    });
  }

  handleBarCodeScanned = async ({ type, data }) => {
    const {buttonState}= this.state;

    if (buttonState === "BookId") {
      this.setState({
        scanned: true,
        scannedBookId:data,
        buttonState: 'normal'
      });
    }
    else if (buttonState === "StudentId") {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal'
      });

    }

  }

  initilzeBookIssue = async ()=>{
    //Add Transaction
    db.collection('Transaction').add({
      'StudentID': this.state.scannedStudentId,
      "BookId": this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'TransactionType':Issued,
    })
    //Change Book Statics
    db.collection('Books').doc(this.state.scannedBookId).update({
      'BookAvailablity': false,
    })
    //Change Amount Of Books Issued For the Student
    db.collection('Student').doc(this.state.scannedBookId).update({
      'NumBookIssued':firebase.firestore.FieldValue.increment(1)
    })
    Alert.alert('Book Issued')
    this.setState({
      scannedStudentId:'',
      scannedBookId:''
    })
  }

  initilzeBookReturn = async ()=>{
    //Add Transaction
    db.collection('Transaction').add({
      'StudentID': this.state.scannedStudentId,
      "BookId": this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'TransactionType':Issued,
    })
    //Change Book Statics
    db.collection('Books').doc(this.state.scannedBookId).update({
      'BookAvailablity': true,
    })
    //Change Amount Of Books Issued For the Student
    db.collection('Student').doc(this.state.scannedBookId).update({
      'NumBookIssued':firebase.firestore.FieldValue.increment(-1)
    })
    Alert.alert('Book Returned')
    this.setState({
      scannedStudentId:'',
      scannedBookId:''
    })
  }

  handleTransaction = async ()=>{
    var transactionMessage
    db.collection('Books').doc(this.state.scannedBookId).get()
    .then ((doc =>{
      var Book=doc.data()
      if(Book.BookAvailablity){
        this.initilzeBookIssue();
        transactionMessage= 'Book Issued'
      }else{
        this.initilzeBookReturn();
        transactionMessage= 'Book Returned'
      }
      this.setState({transactionMessage: transactionMessage})
    }))
  }

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;
  

    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal") {
      return (
        <View style={styles.container}>
          <View>
            <Image source={require("../assets/booklogo.jpg")}
              style={{ width: 200, height: 200 }}>
            </Image>
            <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
          </View>


          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder={"BooK Id"}
              value={this.state.scannedBookId}>
            </TextInput>
            
            <TouchableOpacity style={styles.scanbutton}
              onPress={() => {
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}> Scan </Text>
            </TouchableOpacity>
          </View>


          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder={"Student Id"}
              value={this.state.scannedStudentId}>

            </TextInput>
            <TouchableOpacity style={styles.scanbutton}
            onPress={() => {
              this.getCameraPermissions("StudentId")
            }}>
              <Text style={styles.buttonText}
                > Scan </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={()=> {this.handleTransaction()}}>
              <Text styles={styles.submitButtonText}>
                Submit
              </Text>
            </TouchableOpacity>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:"lightyellow"
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  inputView: {
    flexDirection: "row",
    margin: 20
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },
  buttonText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10
  },
  scanbutton: {
    backgroundColor: "blue", width: 50, borderWidth: 1.5, borderLeftWidth: 0
  },
  submitButton: {
    backgroundColor: 'cyan',
    width: 100,
    height: 50,
    
  },
  submitButtonText: {
    textAlign: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    padding: 10
  }
});
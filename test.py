import serial

ser = serial.Serial("COM6", 115200)

while True:
    cmd = input("Enter image name: ")
    ser.write((cmd + "\n").encode())

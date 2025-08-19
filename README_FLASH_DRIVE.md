# Jupiter - Flash Drive Edition

Welcome to Jupiter. This flash drive contains the complete application.

## Prerequisites

To run Jupiter, you need **Node.js** and **npm** installed on your Mac.

- You can check if you have them by opening `Terminal.app` and running:
  `node -v` and `npm -v`
- If you don't have them, the easiest way to install is from the official website: [https://nodejs.org/](https://nodejs.org/)

## How to Launch

1.  **Open Terminal:** You can find it in `Applications/Utilities/Terminal.app` or search for it with Spotlight (Cmd + Space).

2.  **Navigate to this Directory:** In the terminal, type `cd ` (with a space at the end) and then drag this folder from Finder into the terminal window. Press Enter.

3.  **Make the Launcher Executable:** Run the following command once to give it permission to run:
    ```bash
    chmod +x launch-jupiter.sh
    ```

4.  **Run the Launcher:**
    ```bash
    ./launch-jupiter.sh
    ```

The script will automatically install dependencies, build the application, start the server, and open Jupiter in your default web browser.

To stop the server, go back to the terminal window and press `Ctrl + C`.
#include <iostream>
#include <string>
#include <vector>
#include <conio.h>
#include <sstream>
#include <algorithm>
#include <filesystem>
#include <map>

#include "../include/Flight.h"
#include "../include/Weather.h"
#include "../include/SystemUtils.h"
#include "../include/NetworkManager.h"

std::string getPasswordInput() {
    std::string password = "";
    while (true) {
        int ch = _getch();
        if (ch == 13) {
            std::cout << std::endl;
            return password;
        } else if (ch == 8) {
            if (!password.empty()) {
                password.pop_back();
                std::cout << "\b \b";
            }
        } else if (ch >= 32 && ch <= 126) {
            password += (char)ch;
        }
    }
}

std::string getTerminalInput(std::vector<std::string>& history) {
    std::string currentInput = "";
    int historyPos = history.size();
    
    std::vector<std::string> commands = {
        "search", "weather", "ls", "cat", "sudo", "whoami", 
        "neofetch", "clear", "exit", "history", "ping", "help", "download"
    };

    while (true) {
        int ch = _getch();

        if (ch == 13) {
            std::cout << std::endl;
            return currentInput;
        } 
        else if (ch == 8) {
            if (!currentInput.empty()) {
                currentInput.pop_back();
                std::cout << "\b \b";
            }
        } 
        else if (ch == 9) {
            size_t spacePos = currentInput.find_last_of(' ');
            if (spacePos == std::string::npos) {
                for (const auto& cmd : commands) {
                    if (!currentInput.empty() && cmd.substr(0, currentInput.length()) == currentInput) {
                        while(!currentInput.empty()) { std::cout << "\b \b"; currentInput.pop_back(); }
                        currentInput = cmd;
                        std::cout << currentInput;
                        break;
                    }
                }
            } else {
                std::string partial = currentInput.substr(spacePos + 1);
                namespace fs = std::filesystem;
                try {
                    for (const auto& entry : fs::directory_iterator(".")) {
                        std::string fName = entry.path().filename().string();
                        if (!partial.empty() && fName.find(partial) == 0) {
                            while(currentInput.length() > spacePos + 1) { std::cout << "\b \b"; currentInput.pop_back(); }
                            currentInput += fName;
                            std::cout << fName;
                            break;
                        }
                    }
                } catch (...) {}
            }
        }
        else if (ch == 224) {
            ch = _getch();
            if (ch == 72 && historyPos > 0) {
                historyPos--;
                while(!currentInput.empty()) { std::cout << "\b \b"; currentInput.pop_back(); }
                currentInput = history[historyPos];
                std::cout << currentInput;
            } 
            else if (ch == 80 && historyPos < (int)history.size()) { // DOWN
                historyPos++;
                while(!currentInput.empty()) { std::cout << "\b \b"; currentInput.pop_back(); }
                currentInput = (historyPos == (int)history.size()) ? "" : history[historyPos];
                std::cout << currentInput;
            }
        } 
        else if (ch >= 32 && ch <= 126) {
            currentInput += (char)ch;
            std::cout << (char)ch;
        }
    }
}

int main() {

    #ifdef _WIN32
        system("chcp 65001 > nul");
    #endif

    std::vector<std::string> history;
    std::string inputLine;

    std::map<std::string, Flight> flightDb;

    flightDb["SQ322"] = Flight("SQ322", "WSSS", "EGLL", "EN ROUTE");
    flightDb["BA117"] = Flight("BA117", "EGLL", "KJFK", "BOARDING");
    flightDb["QF1"]   = Flight("QF1",   "YSSY", "EGLL", "SCHEDULED");

    std::cout << "\033[1;36mOpenAero CLI v1.2.0\033[0m" << std::endl;

    while (true) {
        std::cout << "\nopenaero> ";
        
        inputLine = getTerminalInput(history);

        if (inputLine.empty()) continue;

        history.push_back(inputLine);

        std::stringstream ss(inputLine);

        std::string command, argument;
        ss >> command >> argument;

        std::transform(command.begin(), command.end(), command.begin(), ::tolower);

        if (command == "exit") break;

        else if (command == "clear") {
            #ifdef _WIN32
                system("cls");
            #else
                system("clear");
            #endif
        }

        else if (command == "search") {
            if (!argument.empty()) {
                std::transform(argument.begin(), argument.end(), argument.begin(), ::toupper);
                                
                std::cout << "\033[90mConnecting to Aviationstack...\033[0m" << std::endl;
                
                std::string apiKey = "2582c5cc9b95a3ce51c21525ff6a4063";
                std::string url = "http://api.aviationstack.com/v1/flights?access_key=" 
                                + apiKey + "&flight_iata=" + argument;

                std::string response = NetworkManager::fetch(url);
                
                Flight liveFlight = Flight::fromJson(response);
                liveFlight.printTelemetry();
            } else {
                std::cout << "Usage: search <FLIGHT_IATA> (e.g., search SQ322)" << std::endl;
            }
        }
        else if (command == "weather") {
            if (!argument.empty()) {
                std::transform(argument.begin(), argument.end(), argument.begin(), ::toupper);
                Weather report(argument);
                report.display();
            } else {
                std::cout << "Usage: weather <ICAO>" << std::endl;
            }
        }

        else if (command == "neofetch") {
            std::cout << "\033[1;36m    ______           \033[0m \033[1;37mopenaero\033[0m@\033[1;34mtracker\033[0m" << std::endl;
            std::cout << "\033[1;36m  -- \\____/\\         \033[0m ----------------" << std::endl;
            std::cout << "\033[1;36m  --- \\____\\\\        \033[0m \033[1;35mOS:\033[0m OpenAero Native v1.2" << std::endl;
            std::cout << "\033[1;36m  --- /     \\\\       \033[0m \033[1;35mKernel:\033[0m Windows MSVC/GCC" << std::endl;
            std::cout << "\033[1;36m  --- /______//      \033[0m \033[1;35mUplink:\033[0m Active (WinInet)" << std::endl;
            std::cout << "\033[1;36m    \\______/         \033[0m \033[1;35mShell:\033[0m C++20 Standard" << std::endl;
            std::cout << "\033[1;35mSource:\033[0m https://github.com/xaviershilosaputra/OpenAero" << std::endl;
        }

        else if (command == "whoami") {
            std::cout << "openaero (local-user)" << std::endl;
        }

       else if (command == "sudo") {
            if (argument.empty()) {
                std::cout << "usage: sudo <command>" << std::endl;
            } else {
                std::cout << "[sudo] password for openaero: ";
                std::string pass = getPasswordInput();

                if (pass == "admin123") {
                    std::cout << "\033[1;32m[Privileged Execution]\033[0m" << std::endl;
                    if (argument == "ls" || argument == "neofetch") {
                        command = argument; 
                        inputLine = argument;
                    }
                } else {
                    std::cout << "sudo: 1 incorrect password attempt" << std::endl;
                }
            }
        }

        else if (command == "cat") {
            if (!argument.empty()) {
                namespace fs = std::filesystem;
                if (fs::exists(argument) && !fs::is_directory(argument)) {
                    std::cout << "Reading " << argument << "..." << std::endl;
                    SystemUtils::openFile(argument);
                } else {
                    std::cout << "cat: " << argument << ": No such file" << std::endl;
                }
            } else {
                std::cout << "usage: cat <filename>" << std::endl;
            }
        }

        else if (command == "ls") {
            namespace fs = std::filesystem;
            std::cout << "Contents of current directory:\n" << std::endl;
            for (const auto& entry : fs::directory_iterator(".")) {
                if (entry.is_directory()) 
                    std::cout << "\033[1;34m[DIR]  " << entry.path().filename().string() << "\033[0m" << std::endl;
                else 
                    std::cout << "\033[1;32m[FILE] " << entry.path().filename().string() << "\033[0m" << std::endl;
            }
        }
        
        else if (command == "download") {
            if (!argument.empty()) {
                std::transform(argument.begin(), argument.end(), argument.begin(), ::toupper);
                
                bool isLikelyAirport = (argument.length() == 3 || argument.length() == 4) && 
                                       std::all_of(argument.begin(), argument.end(), ::isalpha);

                if (isLikelyAirport) {
                    std::cout << "Fetching weather report for " << argument << "..." << std::endl;
                    Weather report(argument);
                    report.saveReport();
                } else {
                    std::cout << "Fetching flight data for " << argument << "..." << std::endl;
                    std::string apiKey = "2582c5cc9b95a3ce51c21525ff6a4063";
                    std::string url = "http://api.aviationstack.com/v1/flights?access_key=" + apiKey + "&flight_iata=" + argument;
                    std::string response = NetworkManager::fetch(url);
                    Flight liveFlight = Flight::fromJson(response);
                    liveFlight.saveReport();
                }
            } else {
                std::cout << "Usage: download <ID/ICAO>" << std::endl;
            }
        }

        else if (command == "history") {
            for (size_t i = 0; i < history.size(); ++i) {
                std::cout << " " << i + 1 << "  " << history[i] << std::endl;
            }
        }
 
        else if (command == "ping") {
            if (!argument.empty()) {
                std::cout << "Pinging " << argument << " [Native Windows Link]..." << std::endl;
                std::string pingCmd = "ping " + argument;
                system(pingCmd.c_str());
            } else {
                std::cout << "\033[1;31mUsage: ping <address>\033[0m (e.g., ping google.com)" << std::endl;
            }
        }

        else if (command == "help") {
            std::cout << "\033[1;36m--- OpenAero Help Menu ---\033[0m" << std::endl;
            std::cout << "Flight:  search <ID>, weather <ICAO>" << std::endl;
            std::cout << "System:  ls, cat <file>, sudo, whoami, neofetch" << std::endl;
            std::cout << "General: clear, exit" << std::endl;
        }
    }
    return 0;
}

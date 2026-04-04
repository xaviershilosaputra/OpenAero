#ifndef NETWORK_MANAGER_H
#define NETWORK_MANAGER_H

#include <string>
#include <windows.h>
#include <wininet.h>
#include <iostream>

#pragma comment(lib, "wininet.lib")

class NetworkManager {
public:
    static std::string fetch(const std::string& url) {
        HINTERNET hInternet = InternetOpenA("OpenAeroAgent", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
        if (!hInternet) return "";

        HINTERNET hConnect = InternetOpenUrlA(hInternet, url.c_str(), NULL, 0, INTERNET_FLAG_RELOAD, 0);
        if (!hConnect) {
            InternetCloseHandle(hInternet);
            return "";
        }

        std::string response;
        char buffer[4096];
        DWORD bytesRead;

        while (InternetReadFile(hConnect, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
            response.append(buffer, bytesRead);
        }

        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return response;
    }
};

#endif

#ifndef SYSTEM_UTILS_H
#define SYSTEM_UTILS_H

#include <windows.h>
#include <string>

class SystemUtils {
public:
    static void openLink(const std::string& url) {
        ShellExecuteA(NULL, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
    }

    static void openFile(const std::string& filePath) {
        ShellExecuteA(NULL, "edit", filePath.c_str(), NULL, NULL, SW_SHOWNORMAL);
    }
};

#endif

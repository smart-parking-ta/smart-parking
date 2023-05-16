#include <stdio.h>
#include <string.h>

int main()
{
    char text[] = "OPEN-lkdsjflksdjfo-";
    char searchString[] = "OPEN";

    char *result = strstr(text, searchString);

    if (result != NULL)
    {
        printf("'%s' found in '%s'.\n", searchString, text);
    }
    else
    {
        printf("'%s' not found in '%s'.\n", searchString, text);
    }

    return 0;
}

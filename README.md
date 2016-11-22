# tagsToFileNames
A simple shell script which adds/removes the given tags to/from the file names of all files which are piped into 
the script.

The concept of tags contained in the file names itself is heavily inspired by [TagSpaces](https://www.tagspaces.org/).

## Install

#### NPM
```bash
$ npm install -g tagsToFileNames
```

## Usage

#### Add tags

Let say you have a directory containing these files like so

    total 0
    drwxr-xr-x  12 kyusu  staff  408 30 Okt 15:13 .
    drwxr-xr-x   5 kyusu  staff  170 30 Okt 15:11 ..
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1153296479.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1213079645.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1335702062.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1615566250.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1881347061.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1994615544.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 212491440.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 552716224.jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 592280349.jpg
   
and would like to store tags à la [TagSpaces](https://www.tagspaces.org/) in the file names,
you can do so by piping these files in to tagsToFileNames:

```bash
    $ ls | tagsToFileNames add foo,bar,baz
```  

which will result in 

    total 0
    drwxr-xr-x  12 kyusu  staff  408 30 Okt 15:13 .
    drwxr-xr-x   5 kyusu  staff  170 30 Okt 15:11 ..
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1153296479.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1213079645.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1335702062.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1615566250.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1881347061.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1994615544.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 212491440.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 552716224.[foo bar baz].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 592280349.[foo bar baz].jpg
 
#### Remove tags

If you later on decide to remove baz you can do so by running


```bash
    $ ls | tagsToFileNames remove baz
```
  
which will result in 

    total 0
    drwxr-xr-x  12 kyusu  staff  408 30 Okt 15:13 .
    drwxr-xr-x   5 kyusu  staff  170 30 Okt 15:11 ..
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1153296479.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1213079645.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1335702062.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1615566250.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1881347061.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1994615544.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 212491440.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 552716224.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 592280349.[foo bar].jpg
    
#### Filtering using tags

If you're directory looks like this


    total 0
    drwxr-xr-x  12 kyusu  staff  408 30 Okt 15:13 .
    drwxr-xr-x   5 kyusu  staff  170 30 Okt 15:11 ..
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1153296479.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1213079645.[foo].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1335702062.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1615566250.[foo].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1881347061.[foo].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 1994615544.[foo bar].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 212491440.[foo].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 552716224.[foo].jpg
    -rw-r--r--   1 kyusu  staff    0 30 Okt 15:12 592280349.[foo].jpg
 
 and you want to work with all files which are tagged with **bar** you can run
 
 ```bash
     $ ls | tagsToFileNames filter bar
 ```
 
 which will print only these files which are tagged with **bar**.
 
## License

  [MIT](LICENSE)

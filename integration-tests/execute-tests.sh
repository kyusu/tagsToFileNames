#!/usr/bin/env sh

echo "Setting up the integration test"
cd integration-tests
mkdir results
mkdir testing-ground
cd testing-ground
touch 123.txt
touch 456.jpg
touch 789.doc
touch .DS_Store
touch Thumbs.db
mkdir a-dir

echo "##################################"
echo "Starting the tests"
echo "##################################"
echo "Add tags 'foo' & 'bar' to all files"
ls | node ../../tagsToFileNames-add foo,bar
echo "##################################"
echo "Taking a snapshot of the directory"
echo "##################################"
ls -1a | sort -k1 > ../results/add-all.txt
echo "Add tag 'baz' to a single file"
ls 123.\[foo\ bar\].txt | node ../../tagsToFileNames-add baz
echo "##################################"
echo "Taking a snapshot of the directory"
echo "##################################"
ls -1a | sort -k1 > ../results/add-single.txt
echo "Filtering all files for ones tagged with 'baz'"
ls | node ../../tagsToFileNames-filter baz > ../results/filter.txt
echo "##################################"
echo "Removing tag 'baz' from all files"
ls | node ../../tagsToFileNames-remove baz
echo "##################################"
echo "Taking a snapshot of the directory"
echo "##################################"
ls -1a | sort -k1 > ../results/remove-single.txt
echo "Removing tag 'foo' from all files"
ls | node ../../tagsToFileNames-remove foo
echo "##################################"
echo "Taking a snapshot of the directory"
echo "##################################"
ls -1a | sort -k1 > ../results/remove-all.txt

cd ..

echo "Comparing the results with our snapshots"
ADD_ALL="$(diff results/add-all.txt snapshots/add-all.txt)"
ADD_SINGLE="$(diff results/add-single.txt snapshots/add-single.txt)"
FILTER="$(diff results/filter.txt snapshots/filter.txt)"
REMOVE_SINGLE="$(diff results/remove-single.txt snapshots/remove-single.txt)"
REMOVE_ALL="$(diff results/remove-all.txt snapshots/remove-all.txt)"
echo "##################################"

echo "Cleaning up after the integration test"
rm -rf results
rm -rf testing-ground

echo "##################################"
echo "Results"
echo "##################################"

if [ ! -z "$ADD_ALL" ]; then
    echo "𐄂 Adding tags to all files has failed!"
    echo "$ADD_ALL"
else
    echo "✓ Adding tags to all files has passed."
fi

if [ ! -z "$ADD_SINGLE" ]; then
    echo "𐄂 Adding tags to a single files has failed!"
    echo "$ADD_SINGLE"
else
    echo "✓ Adding tags to a single files has passed."
fi

if [ ! -z "$FILTER" ]; then
    echo "𐄂 Filtering files based on tags has failed!"
    echo "$FILTER"
else
    echo "✓ Filtering files based on tags has passed."
fi

if [ ! -z "$REMOVE_SINGLE" ]; then
    echo "𐄂 Removing tags from a single file has failed!"
    echo "$REMOVE_SINGLE"
else
    echo "✓ Removing tags from a single file has passed."
fi

if [ ! -z "$REMOVE_ALL" ]; then
    echo "𐄂 Removing tags from all files has failed!"
    echo "$REMOVE_ALL"
else
    echo "✓ Removing tags from all files has passed."
fi

if [ ! -z "$ADD_ALL" ] || [ ! -z "$ADD_SINGLE" ] || [ ! -z "$FILTER" ] || [ ! -z "$FILTER" ] || [ ! -z "$REMOVE_SINGLE" ] || [ ! -z "$REMOVE_ALL" ]; then
  exit 1
fi

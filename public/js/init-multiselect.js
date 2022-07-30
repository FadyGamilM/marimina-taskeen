$(function() {
    let myOptions = ['one', 'two', 'three'];
    console.log('here');
    VirtualSelect.init({
        ele: '#example-select',
        options: myOptions,
        multiple: true,
        search: true,
        searchGroup: false, // Include group title for searching
        searchByStartsWith: true, // Search options by startsWith() method
        placeholder: 'اختار 3 اسماء بالكتير'
    });

});
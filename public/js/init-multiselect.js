$(function() {

    const initMultiSelect = (id, collection) => {
        VirtualSelect.init({
            ele: id,
            options: collection,
            multiple: true,
            search: true,
            searchGroup: false, // Include group title for searching
            searchByStartsWith: true, // Search options by startsWith() method
            placeholder: 'اختار 3 اسماء بالكتير'
        });
    };

    $.ajax({
        type: "GET",
        url: 'https://marimina-tasken.herokuapp.com/users', //TODO....fix this by adding support for CORS
        contentType: 'application/json',
        success: function(response) {
            let boys = response.boys.map(boy => boy.name);
            let girls = response.girls.map(girl => girl.name);
            let all = [...boys, ...girls];
            initMultiSelect('#boys-select', boys);
            initMultiSelect('#girls-select', girls);
            initMultiSelect('#families-select', girls);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Failed to get boys and girls not in a room!!!");
        },
    });    

    /* add event lister to the select for boys and girls */
    const roomTypeSelectElement = document.querySelector('#room-type');
    const boysMultiSelect = document.querySelector('#boys-select');
    const girlsMultiSelect = document.querySelector('#girls-select');
    const familiesMultiSelect = document.querySelector('#families-select');

    roomTypeSelectElement.addEventListener('change', (event) => {
        girlsMultiSelect.classList.remove('hidden');
        boysMultiSelect.classList.remove('hidden');
        familiesMultiSelect.classList.remove('hidden');

        if (event.target.value === 'boys') {
            girlsMultiSelect.classList.add('hidden');
            familiesMultiSelect.classList.add('hidden');
        } else if (event.target.value === 'girls'){
            boysMultiSelect.classList.add('hidden');
            familiesMultiSelect.classList.add('hidden');
        } else {
            boysMultiSelect.classList.add('hidden');
            girlsMultiSelect.classList.add('hidden');
        }
      });
});
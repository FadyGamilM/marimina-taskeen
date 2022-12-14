$(function() {

    $('.btn-link[aria-expanded="true"]').closest('.accordion-item').addClass('active');
  $('.collapse').on('show.bs.collapse', function () {
	  $(this).closest('.accordion-item').addClass('active');
	});

  $('.collapse').on('hidden.bs.collapse', function () {
	  $(this).closest('.accordion-item').removeClass('active');
	});

	$('form').submit((event) => {
		event.preventDefault();
		const roomType = $('#room-type').find(":selected").val();
		const notes = $('#notes').val();
		let selectedNames = null;
		if (roomType === 'boys') {
			selectedNames = $('#boys-select').val();
		} else if (roomType === 'girls') {
			selectedNames = $('#girls-select').val();
		} else {
			selectedNames = $('#families-select').val();
		}
		
		if (selectedNames.length < 1 || selectedNames.length > 3) {
			alert('من فضلك اختار من اسم حتى ثلاثة اسماء');
		} else {
			let message = null;
			if (confirm(`متأكد انك عايز تسكن ${selectedNames} فى غرفة واحدة؟`)) {
				$('#submit').prop('disabled', true);
				$.ajax({
					type: "POST",
					url: 'https://marimina-tasken.herokuapp.com/rooms', //TODO....fix this by adding support for CORS
					contentType: 'application/json',
					data: JSON.stringify({roomType, selectedNames, notes}),
					success: function(response) {
						alert("تم انشاء غرفة بنجاح");
						window.location.reload(true);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						alert("Failed to get boys and girls not in a room!!!");
					},
				});   
			}
		}
	})
    

});
$(function(){
	let arrPath = window.location.pathname.split('/');
	arrPath.pop();
	const pathStub = arrPath.join('/');
	$('.editable-tags li>.tag').each(function () {
		const tag = $( this );
		const removeButton = $('<a class="delete" href="#"></a>');
		const par = tag.parent();

		removeButton.click(function(e) {
			e.preventDefault();
			$.ajax({
				url: pathStub + '/tag/' + tag.text(),
				method: 'DELETE',
				success: remove => par.remove()
			});
		});

		par.append(removeButton);
	});
})

//Я на Гитхабе https://github.com/polozkov
//настройки прорисовки фрактала Курликю
DRAWING_SETS = {
    //сколько отрезков будет в ломаной линии?
    n_segments: 10000,

    //на сколько увеличивать угол прироста за один кадр
    step_animate: 1e9,

    //угол прироста "D", углы будут: S,  S + D,  S + D + 2D,  S + D + 2D + 3D,
    angle_delta: 15.1179 * (Math.PI / 180),

    //начальный угол "S"
    angle_start: 0.0,


    //сколько десятичных знаков будет точность отрисовки лиманой линии
    n_digits: 1,

    //длина каждого отрезка относительно меньшей стороны SVG элемента
    segment_length_to_min: 0.1,

    //начало в центре SVG элемента
    start_xy: [0.5, 0.5],

    //ширина линии относительно минимальной стороны SVG-элемента
    stroke_width_by_svg_min_size: 0.01
};

//SVG-элемент с ломаной линией, размеры SVG
ELEMENTS = {
    //HTML-элемент SVG по идентификатору
    svg: window.document.getElementById("id_main_svg"),

    //ломаная линия в svg-элементе
    polyline: window.document.getElementById("id_main_polyline"),

    //размеры svg-элемента (ширина и высота в пикселях)
    f_get_svg_wh: function () {
        return [ELEMENTS.svg.clientWidth, ELEMENTS.svg.clientHeight];
    },

    //меньшая сторона SVG элемента
    f_get_svg_min_size: function () {
        return Math.min(ELEMENTS.svg.clientWidth, ELEMENTS.svg.clientHeight);
    },
};

//вычисление координат точек ломаной по настройкам: в виде строки для POLYLINE
CALCULATE = {
    //конвертируй [[1.4, 2.4], [3.5,8]] с точность n_digits: "1.4,2.4 3.5,8.0"
    f_pairs_to_string: function (arr_of_pairs_xy, n_dig) {
        //i-тая пара чисел, которую переносится в строку, разделённую запятой
        var ix = arr_of_pairs_xy[0][0];
        var iy = arr_of_pairs_xy[0][1];
        //округли (n_dig десятичных знаков)
        var s = ix.toFixed(n_dig) + "," + iy.toFixed(n_dig);

        //нулевую пару добавили, начни с первой, добавляя пробелы
        for (var i = 1; i < arr_of_pairs_xy.length; i++) {
            ix = arr_of_pairs_xy[i][0].toFixed(n_dig);
            iy = arr_of_pairs_xy[i][1].toFixed(n_dig);

            //разделяй пары с запятой ix,iy между собой пробелами
            s = s + " " + ix + ',' + iy;
        }
        return s;
    },

    //точки ломаной; в настройках число сегментов + углы: начальный и прирост
    f_generate_segments: function (p0, lines_length, GOTTEN_DRAWING_SETS) {
        //относительный отрезок (относительно предыдущей точки)
        var ix = p0[0];
        var iy = p0[1];

        //текущий угол, котороый будет меняться в цикле
        var i_angle = GOTTEN_DRAWING_SETS.angle_start;

        //результат: точка за точкой (изначально добавь нулевую точку)
        var array_of_pairs = [[p0[0], p0[1]]];

        //повторяй n_segments раз, в итоге будет на 1 тточку больше
        for (var i = 0; i < GOTTEN_DRAWING_SETS.n_segments; i++) {
            //текущий угол увеличь на прирост
            i_angle += GOTTEN_DRAWING_SETS.angle_delta * i;

            //текущий угол и длина отрезка задают относительное положение
            ix += lines_length * Math.cos(i_angle);
            iy += lines_length * Math.sin(i_angle);

            //добавь в итоговый массив точек текущую точку
            array_of_pairs.push([ix, iy]);
        }
        return array_of_pairs;
    },

    //определи пользовательскую область просмотра, зная точки и толщину линии
    f_view_box: function (points, line_width) {
        //границы точек в полученном массиве
        var min_x = Infinity;
        var min_y = Infinity;
        var max_x = -Infinity;
        var max_y = -Infinity;

        for (var i = 0; i < points.length; i++) {
            //обнови минимумы
            min_x = Math.min(min_x, points[i][0]);
            min_y = Math.min(min_y, points[i][1]);

            //обнови максимумы
            max_x = Math.max(max_x, points[i][0]);
            max_y = Math.max(max_y, points[i][1]);
        }

        //начни показ с минимума, вычев половину толщины линии
        var x = min_x - line_width / 2.0;
        var y = min_y - line_width / 2.0;
        //размеры с учётом толщины линии
        var w = max_x - min_x + line_width;
        var h = max_y - min_y + line_width;

        //верни область просмотра с кромкой в 1 пиксель (размеры +2 пикселя)
        return ((x - 1) + " " + (y - 1) + " " + (w + 2) + " " + (h + 2));
    },

    //рисуй ломаную фрактала в соответствии с настройками
    f_set_polyline_by_drawing_set: function (S) {
        //размеры SVG-элемента в пикселях (ширина и высота)
        var svg_wh = ELEMENTS.f_get_svg_wh();
        //минимум из ширины и длины (меньшая сторона)
        var svg_min_size = ELEMENTS.f_get_svg_min_size();

        //начальная точка ломаной = относительные_координаты * размер_SVG
        var xy_0 = [S.start_xy[0] * svg_wh[0], S.start_xy[1] * svg_wh[1]];

        //абсолютная длина отрезка (в настройках относительно svg_min_size)
        var line_len = S.segment_length_to_min * svg_min_size;

        //сгенерированный массив координат точек ломаной
        var points = CALCULATE.f_generate_segments(xy_0, line_len, S);
        //строка из координато точек, (пары с запятыми, а между ними пробелы)
        var points_string = CALCULATE.f_pairs_to_string(points, S.n_digits);
        //задай атрибут ломаной линии: координаты точек
        ELEMENTS.polyline.setAttribute("points", points_string);

        //вычисленная толщина линии, зависящая от размеров SVG
        var line_width = svg_min_size * S.stroke_width_by_svg_min_size;
        //толщина линии в виде строки из целого числа, измеренная в пикселях
        var line_width_string = Math.round(line_width) + "px";
        //задай атрибут ломаной линии: толщина линии в пикселях
        ELEMENTS.svg.setAttribute("stroke-width", line_width_string);

        //область просмотра зависит от точек и толщины линии
        var view_box_string = CALCULATE.f_view_box(points, line_width);
        //задай атрибут ломаной линии: область просмотра, куда вписан фрактал
        ELEMENTS.svg.setAttribute("viewBox", view_box_string);

    },
};

//Функция кдля россбраузерной анимации
//Если ничего нет - возвращаем обычный таймер
window.f_my_request_animation_frame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
            //частота 60 герц (1000 миллисекунд = 1 секунда)
            window.setTimeout(callback, 1000 / 60);
        };
})();

//немедленно вызываемая функция: Immediately Invoked Function Expression
(function f_animation_start() {
    //сохраним начальный угол смещения для фрактала Курликю
    var START_ANGLE_DELTA = DRAWING_SETS.angle_delta;
    //будем делать анимацию пошагово на каждый кадр
    var n_step = 0;
    //на сколько текущий угол больше начального на данном шаге
    var n_step_angle_plus = 0;

    //IIFE (Immediately Invoked Function Expression)
    (function f_animation_loop() {
        //работаем по кадрово: +1 шаг для изменения приращения поворота
        n_step++;
        //на сколько текущий угол больше начального?
        n_step_angle_plus = n_step / DRAWING_SETS.step_animate;

        //к стартовому углу прибавим небольшое приращение для каждого шага
        DRAWING_SETS.angle_delta = START_ANGLE_DELTA + n_step_angle_plus;

        //перерисуем ломаную линию с новым  настройками
        CALCULATE.f_set_polyline_by_drawing_set(DRAWING_SETS);

        //вызовем следующую анимацию рекурсивно
        window.f_my_request_animation_frame(f_animation_loop);
    }());
}());


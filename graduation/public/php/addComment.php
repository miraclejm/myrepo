<?php
    $cuser = $_POST["username"];
    $comment = $_POST["comment"];
    $time = $_POST["time"];
    $title = $_POST["title"];
    $name = $_POST["name"];
    $msg = $_POST["msg"];
    $db = mysqli_connect('localhost','root','123456');
    $db_selected = mysqli_select_db($db,'graduation');
    $query = "select * from comment where time='".$time."'&&title='".$title."'&&name='".$name."'&&msg='".$msg."'";
    $result = mysqli_query($db,$query);
    while ($row = mysqli_fetch_assoc($result))
    {
    $select = array("name"=>$row['name'],"time"=>$row['time'],"title"=>$row['title'],
        "msg"=>$row['msg'],"comment"=>$row['comment'],"cuser"=>$row['cuser']);
    }
    $addComment = $select["comment"] . "_jm_".$comment;
    $addUser = $select["cuser"] . "_jm_".$cuser;
    $query2 = "update comment set cuser='".$addUser."',comment='".$addComment."' where time='".$time."'&&title='".$title."'&&name='".$name."'&&msg='".$msg."'";
    $result2 = mysqli_query($db,$query2);
    echo 1;
    mysqli_close($db);
?>